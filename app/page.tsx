import { getDb } from '@/lib/mongodb';
import type { SpeechPart, Talker } from '@/types/index';

type SearchParams = { [key: string]: string | string[] | undefined };

function toStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

function buildQueryString(params: Record<string, string>): string {
  const sp = new URLSearchParams(params);
  return sp.toString();
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const q = toStr(searchParams.q);
  const party = toStr(searchParams.party);
  const electorate = toStr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const debateCategory = toStr(searchParams.debate_category);
  const talkerId = toStr(searchParams.talker_id);

  const db = await getDb();

  // Distinct lists for filters
  const [parties, electorates, categories] = await Promise.all([
    db.collection('talkers').distinct('party', { party: { $ne: null } }) as Promise<string[]>,
    db.collection('talkers').distinct('electorate', { electorate: { $ne: null } }) as Promise<string[]>,
    db.collection('speeches').distinct('debate_category', { debate_category: { $ne: null } }) as Promise<string[]>,
  ]);

  // Talker search
  const talkerFilter: any = {};
  if (q) {
    talkerFilter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { id: { $regex: q, $options: 'i' } },
      { electorate: { $regex: q, $options: 'i' } },
      { party: { $regex: q, $options: 'i' } },
    ];
  }
  if (party) talkerFilter.party = party;
  if (electorate) talkerFilter.electorate = electorate;

  const talkers = (await db
    .collection('talkers')
    .find(talkerFilter)
    .project({ _id: 0 })
    .limit(50)
    .toArray()) as Talker[];

  const activeTalkerId = talkerId || (talkers.length > 0 ? talkers[0]!.id : '');
  let speechParts: SpeechPart[] = [];
  if (activeTalkerId) {
    const speechFilter: any = { talker_id: activeTalkerId };
    const range: any = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) range.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) range.$lte = d;
    }
    if (Object.keys(range).length) speechFilter.date = range;
    if (debateCategory) speechFilter.debate_category = debateCategory;

    speechParts = (await db
      .collection('speeches')
      .find(speechFilter)
      .project({ _id: 0 })
      .sort({ date: -1, speech_id: 1, seq: 1 })
      .limit(250)
      .toArray()) as SpeechPart[];
  }

  // Group by speech_id
  const grouped: [string, SpeechPart[]][] = [];
  {
    const map = new Map<string, SpeechPart[]>();
    for (const p of speechParts) {
      const arr = map.get(p.speech_id) || [];
      arr.push(p);
      map.set(p.speech_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.seq - b.seq);
    // Order groups by most recent date from first part
    const entries = Array.from(map.entries());
    entries.sort((a, b) => new Date(b[1][0]!.date).getTime() - new Date(a[1][0]!.date).getTime());
    grouped.push(...entries);
  }

  // Helpers to build links preserving filters
  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (party) baseParams.party = party;
  if (electorate) baseParams.electorate = electorate;
  if (from) baseParams.from = from;
  if (to) baseParams.to = to;
  if (debateCategory) baseParams.debate_category = debateCategory;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <form method="GET" className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="col" style={{ minWidth: 240 }}>
            <label htmlFor="q">Search</label>
            <input id="q" name="q" className="input" placeholder="name, id, electorate, party" defaultValue={q} />
          </div>
          <div>
            <label htmlFor="party">Party</label>
            <select id="party" name="party" className="input" defaultValue={party}>
              <option value="">All</option>
              {parties.sort().map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="electorate">Electorate</label>
            <select id="electorate" name="electorate" className="input" defaultValue={electorate}>
              <option value="">All</option>
              {electorates.sort().map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="debate_category">Debate</label>
            <select id="debate_category" name="debate_category" className="input" defaultValue={debateCategory}>
              <option value="">All</option>
              {categories.sort().map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
          <div style={{ alignSelf: 'end' }}>
            <button type="submit" className="input" style={{ cursor: 'pointer' }}>
              Apply
            </button>
          </div>
        </form>
      </div>

      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="col" style={{ maxWidth: 420 }}>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Talkers</h2>
            <form method="GET" action="/bill/_lookup" style={{ margin: '0.5rem 0 1rem 0' }}>
              <label htmlFor="bill-id" className="muted">Jump to bill by ID</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input id="bill-id" name="id" className="input" placeholder="Enter bill ID" />
                <button type="submit" className="input" style={{ cursor: 'pointer' }}>Go</button>
              </div>
            </form>
            <ul className="list">
              {talkers.map((t) => {
                const params = buildQueryString({ ...baseParams, talker_id: t.id });
                const isActive = t.id === activeTalkerId;
                return (
                  <li key={t.id}>
                    <a href={`/?${params}`} style={{ textDecoration: isActive ? 'underline' : 'none' }}>
                      <strong>{t.name}</strong>{' '}
                      {t.party && <span className="badge">{t.party}</span>}{' '}
                      {t.electorate && <span className="muted">— {t.electorate}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Latest speech contributions</h2>
            {!activeTalkerId && <p className="muted">Select a talker to view speeches.</p>}
            {activeTalkerId && grouped.length === 0 && <p className="muted">No speeches found for current filters.</p>}
            {activeTalkerId && (
              <ul className="list">
                {grouped.map(([speechId, parts]) => {
                  const first = parts[0];
                  const snippet = (first?.content || '').slice(0, 240);
                  const speechParams = buildQueryString({ ...baseParams, talker_id: activeTalkerId });
                  return (
                    <li key={speechId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <a href={`/speech/${encodeURIComponent(speechId)}?${speechParams}`}>
                          <strong>{first?.debate_title || 'Untitled debate'}</strong>
                        </a>
                        <span className="muted">{new Date(first?.date || '').toLocaleDateString()}</span>
                      </div>
                      {first?.bill_id && (
                        <div className="muted" style={{ marginTop: '0.25rem' }}>
                          <a className="badge" href={`/bill/${encodeURIComponent(first.bill_id as string)}`}>Related bill</a>
                        </div>
                      )}
                      {first && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span className="badge" style={{ textTransform: 'capitalize' }}>{first.type}</span>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>
                            {snippet}{(first.content?.length || 0) > 240 ? '…' : ''}
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
                            <a className="muted" href={`/speech/${encodeURIComponent(speechId)}?${speechParams}#part-${first.seq}`}>View in context ¶</a>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
