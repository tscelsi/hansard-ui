import { getDb } from '@/lib/mongodb';
import type { SpeechPart, Talker } from '@/types/index';

type SpeechSummary = {
  speech_id: string;
  date: string;
  debate_title: string;
  talker_ids: string[];
  first_snippet: string;
  subdebate_title?: string | null;
  main_talker_id?: string;
};

type SearchParams = { [key: string]: string | string[] | undefined };

function toStr(v: string | string[] | undefined) { return Array.isArray(v) ? (v[0] ?? '') : (v ?? ''); }

export default async function BillPage({ params, searchParams }: { params: { id: string }, searchParams: SearchParams }) {
  const billId = params.id;
  const page = Math.max(parseInt(toStr(searchParams.page) || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(toStr(searchParams.pageSize) || '20', 10), 5), 100);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const talkerId = toStr(searchParams.talker_id);
  const db = await getDb();

  // Fetch all parts for this bill (could be large; consider pagination later)
  const filter: any = { bill_id: billId };
  const range: any = {};
  if (from) { const d = new Date(from); if (!isNaN(d.getTime())) range.$gte = d; }
  if (to) { const d = new Date(to); if (!isNaN(d.getTime())) range.$lte = d; }
  if (Object.keys(range).length) filter.date = range;
  if (talkerId) filter.talker_id = talkerId;

  // Aggregate by speech_id to page efficiently at speech granularity
  const pipeline: any[] = [
    { $match: filter },
    { $sort: { date: -1, speech_id: 1, seq: 1 } },
    { $group: {
        _id: '$speech_id',
        first: { $first: '$$ROOT' },
        talker_ids: { $addToSet: '$talker_id' },
        parts: { $push: '$$ROOT' },
      } },
    { $project: {
        _id: 0,
        speech_id: '$_id',
        date: '$first.date',
        debate_title: '$first.debate_title',
        talker_ids: 1,
        first_snippet: { $substr: ['$first.content', 0, 240] },
        subdebate_title: '$first.subdebate_title',
        main_talker_id: '$first.talker_id',
      } },
    { $sort: { date: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ];
  const summaries = (await db.collection('speeches').aggregate(pipeline).toArray()) as SpeechSummary[];

  // For counts (simple estimate: count distinct speech_id under filter)
  const totalSpeeches = await db.collection('speeches').distinct('speech_id', filter).then((arr) => arr.length);

  if (!summaries.length) {
    return (
      <div className="container">
        <div className="card">
          <a href="/">← Back</a>
          <h1 style={{ marginTop: '0.5rem' }}>Bill {billId}</h1>
          <p className="muted">No speeches found for this bill.</p>
        </div>
      </div>
    );
  }

  // Resolve talker names and derive bill title (use most common debate_title among summaries)
  const allTalkerIds = Array.from(new Set(summaries.flatMap((s) => s.talker_ids)));
  const talkers = (await db
    .collection('talkers')
    .find({ id: { $in: allTalkerIds } })
    .project({ _id: 0 })
    .toArray()) as Talker[];
  const talkerMap = new Map<string, Talker>(talkers.map((t) => [t.id!, t]));

  let billTitle = `Bill ${billId}`;
  if (summaries.length) {
    const counts = new Map<string, number>();
    for (const s of summaries) {
      const key = s.debate_title || '';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (best && best[0]) billTitle = best[0];
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <a href="/">← Back</a>
        <h1 style={{ marginTop: '0.5rem' }}>{billTitle}</h1>
        <p className="muted">Speeches related to this bill</p>
        <form method="GET" className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <div>
            <label htmlFor="talker_id">Talker</label>
            <select id="talker_id" name="talker_id" className="input" defaultValue={talkerId}>
              <option value="">All</option>
              {Array.from(new Set(summaries.flatMap((s) => s.talker_ids)))
                .map((id) => ({ id, name: talkerMap.get(id)?.name || id }))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="from">From</label>
            <input id="from" name="from" type="date" className="input" defaultValue={from} />
          </div>
          <div>
            <label htmlFor="to">To</label>
            <input id="to" name="to" type="date" className="input" defaultValue={to} />
          </div>
          <div>
            <label htmlFor="pageSize">Page size</label>
            <select id="pageSize" name="pageSize" className="input" defaultValue={String(pageSize)}>
              {[10,20,50,100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button type="submit" className="input" style={{ cursor: 'pointer' }}>Apply</button>
          </div>
        </form>
      </div>

      <div className="card">
        <ul className="list">
          {summaries.map((s) => {
            const mainName = s.main_talker_id ? (talkerMap.get(s.main_talker_id)?.name || s.main_talker_id) : undefined;
            const names = s.talker_ids
              .map((id) => talkerMap.get(id)?.name || id)
              .slice(0, 3);
            const extra = s.talker_ids.length - names.length;
            return (
              <li key={s.speech_id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <a href={`/speech/${encodeURIComponent(s.speech_id)}`}>
                    <strong>{mainName || 'Speech'}</strong>
                  </a>
                  <span className="muted">{new Date(s.date).toLocaleDateString()}</span>
                </div>
                {s.subdebate_title && (
                  <div className="muted" style={{ marginTop: '0.25rem' }}>
                    <span className="badge">{s.subdebate_title}</span>
                  </div>
                )}
                <div className="muted" style={{ marginTop: '0.25rem' }}>
                  {names.join(', ')}{extra > 0 ? `, +${extra} more` : ''}
                </div>
                {s.first_snippet && (
                  <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{s.first_snippet}…</div>
                )}
              </li>
            );
          })}
        </ul>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {page > 1 && (
            <a className="badge" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries({ talker_id: talkerId, from, to, pageSize }).filter(([_,v]) => v)), page: String(page - 1) }).toString()}`}>← Prev</a>
          )}
          {(page * pageSize) < totalSpeeches && (
            <a className="badge" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries({ talker_id: talkerId, from, to, pageSize }).filter(([_,v]) => v)), page: String(page + 1) }).toString()}`}>Next →</a>
          )}
          <span className="muted">Page {page} of {Math.max(1, Math.ceil(totalSpeeches / pageSize))}</span>
        </div>
      </div>
    </div>
  );
}
