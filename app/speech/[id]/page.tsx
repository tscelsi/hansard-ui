import { getDb } from '@/lib/mongodb';
import type { SpeechPart, Talker } from '@/types/index';

type SearchParams = { [key: string]: string | string[] | undefined };
function toStr(v: string | string[] | undefined) { return Array.isArray(v) ? (v[0] ?? '') : (v ?? ''); }

export default async function SpeechPage({ params, searchParams }: { params: { id: string }, searchParams: SearchParams }) {
  const { id } = params;
  const q = toStr(searchParams.q);
  const party = toStr(searchParams.party);
  const electorate = toStr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const filtersDebateCategory = toStr(searchParams.debate_category);
  const talkerIdParam = toStr(searchParams.talker_id);
  const db = await getDb();

  const parts = (await db
    .collection('speeches')
    .find({ speech_id: id })
    .project({ _id: 0 })
    .sort({ seq: 1 })
    .toArray()) as SpeechPart[];

  if (!parts.length) {
    return (
      <div className="container">
        <div className="card">
          <p className="muted">No parts found for speech {id}.</p>
        </div>
      </div>
    );
  }

  const talkerIds = Array.from(new Set(parts.map((p) => p.talker_id)));
  const talkers = (await db
    .collection('talkers')
    .find({ id: { $in: talkerIds } })
    .project({ _id: 0 })
    .toArray()) as Talker[];
  const talkerMap = new Map<string, Talker>(talkers.map((t) => [t.id, t]));

  const p0 = parts[0];
  const title = p0?.debate_title || 'Speech';
  const dateStr = p0?.date ? new Date(p0.date).toLocaleDateString() : '';
  const debateCategory = p0?.debate_category || '';
  const debateInfo = p0?.debate_info || '';
  const subdebateTitle = p0?.subdebate_title || '';
  const subdebateInfo = p0?.subdebate_info || '';
  const billId = p0?.bill_id || '';

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
  <a href={`/?${new URLSearchParams(Object.fromEntries(Object.entries({ q, party, electorate, from, to, debate_category: filtersDebateCategory, talker_id: talkerIdParam }).filter(([_, v]) => v))).toString()}`}>← Back</a>
        <h1 style={{ marginTop: '0.5rem' }}>{title}</h1>
        {dateStr && <p className="muted">{dateStr}</p>}
        <p className="muted">Speech ID: {id}</p>
        {billId && (
          <p style={{ marginTop: '0.25rem' }}>
            <a href={`/bill/${encodeURIComponent(billId)}`} className="badge" title="View all speeches for this bill">
              View related bill
            </a>
          </p>
        )}
        <div style={{ marginTop: '0.5rem' }}>
          {debateCategory && (
            <p style={{ margin: 0 }}>
              <span className="badge">{debateCategory}</span>
              {debateInfo && <span className="muted"> — {debateInfo}</span>}
            </p>
          )}
          {(subdebateTitle || subdebateInfo) && (
            <p style={{ margin: '0.25rem 0 0 0' }}>
              <strong>Subdebate:</strong>{' '}
              {subdebateTitle || '—'}
              {subdebateInfo && <span className="muted"> — {subdebateInfo}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sequence</h2>
        <ol className="list" style={{ listStyle: 'none', padding: 0 }}>
          {parts.map((p) => {
            const t = talkerMap.get(p.talker_id);
            const who = t?.name || p.talker_id;
            const anchor = `part-${p.seq}`;
            return (
              <li key={p.seq}>
                <section id={anchor} className="part">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
                    <div>
                      <span className="badge" style={{ textTransform: 'capitalize', marginRight: 8 }}>#{p.seq} {p.type}</span>
                      <strong>{who}</strong>
                      {t?.party && <span className="badge" style={{ marginLeft: 8 }}>{t.party}</span>}
                      {t?.electorate && <span className="muted"> — {t.electorate}</span>}
                    </div>
                    <a href={`#${anchor}`} className="muted" title="Link to this part">¶</a>
                  </div>
                  <div className="speech-text" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{p.content}</div>
                </section>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
