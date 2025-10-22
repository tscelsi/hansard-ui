import { getDb } from "@/lib/mongodb";
import type { Talker } from "@/types/index";
import Badge from "components/Badge";
import SpeechFilters from "components/SpeechFilters";
import SpeakerTitle from "components/SpeakerTitle";

export const runtime = "nodejs";

type SearchParams = { [key: string]: string | string[] | undefined };

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";
const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

function buildParamsFromSearch(searchParams: SearchParams) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) {
      for (const item of v) if (item) sp.append(k, item);
    } else if (typeof v === "string" && v) {
      sp.append(k, v);
    }
  }
  return sp.toString();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const categoriesSel = toArr(searchParams.debate_category);
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const includeInterjections = ["1", "true", "on", "yes"].includes(
    toStr(searchParams.include_interjections).toLowerCase()
  );
  const sort = toStr(searchParams.sort) === "asc" ? "asc" : "desc";

  const db = await getDb();

  // Build match filter for speech parts
  const match: any = {};
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
  const range: any = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  if (Object.keys(range).length) match.date = range;
  if (!includeInterjections) match.type = { $ne: "interjection" };

  const sortDir = sort === "asc" ? 1 : -1;

  // Aggregate to speech-level summaries
  const pipeline: any[] = [
    { $match: match },
    { $sort: { date: sortDir, speech_id: 1, seq: 1 } },
    {
      $group: {
        _id: "$speech_id",
        first: { $first: "$$ROOT" },
        talker_ids: { $addToSet: "$talker_id" },
      },
    },
    {
      $project: {
        _id: 0,
        speech_id: "$_id",
        date: "$first.date",
        debate_title: "$first.debate_title",
        debate_category: "$first.debate_category",
        bill_id: "$first.bill_id",
        type: "$first.type",
        first_seq: "$first.seq",
        first_content: "$first.content",
        main_talker_id: "$first.talker_id",
        talker_ids: 1,
      },
    },
    { $sort: { date: sortDir } },
    { $limit: 200 },
  ];
  const summaries = (await db
    .collection("speeches")
    .aggregate(pipeline)
    .toArray()) as any[];

  // Resolve talker names for display
  const ids = Array.from(
    new Set(
      summaries
        .flatMap((s) => [s.main_talker_id, ...(s.talker_ids || [])])
        .filter(Boolean)
    )
  );
  const talkerDocs = (await db
    .collection("talkers")
    .find({ id: { $in: ids } }, { projection: { _id: 0 } })
    .toArray()) as unknown as Talker[];
  const talkerMap = new Map<string, Talker>(talkerDocs.map((t) => [t.id!, t]));

  // Build search form selected values
  const selected = {
    categoriesSel,
    partiesSel,
    electoratesSel,
  };

  const passThroughParams = buildParamsFromSearch(searchParams);

  return (
    <div className="container">
      {summaries.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          No speeches found for current filters.
        </p>
      )}
      {summaries.length > 0 && (
        <div>
          {summaries.map((s) => {
            const main = s.main_talker_id
              ? talkerMap.get(s.main_talker_id)
              : undefined;
            const snippet = (s.first_content || "").slice(0, 120);
            const href = `/speech/${encodeURIComponent(
              s.speech_id
            )}?${passThroughParams}`;
            return (
              <div
                key={s.speech_id}
                className="flex flex-col gap-2 p-2 border-b"
              >
                <div className="flex flex-col gap-1">
                  {main && (
                    <SpeakerTitle
                      name={main.name}
                      electorate={main.electorate}
                      date={s.date}
                    />
                  )}
                  <div className="flex justify-between items-baseline text-3xl">
                    <a href={href}>
                      <strong>{s.debate_title || "Speech"}</strong>
                    </a>
                  </div>
                  <div className="flex gap-1">
                    {(main?.party || s.bill_id) && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        {main?.party && <Badge>{main.party}</Badge>}
                      </div>
                    )}
                    <Badge>House of Representatives</Badge>
                  </div>
                </div>
                <div className="whitespace-pre-wrap">
                  {`${snippet}${
                    (s.first_content?.length || 0) > 240 ? "…" : ""
                  }`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
