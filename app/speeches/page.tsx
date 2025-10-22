import { getDb } from "@/lib/mongodb";
import { Talker } from "@/types/index";
import Badge, { HouseBadge } from "components/Badge";
import SpeakerTitle from "components/SpeakerTitle";
import { Route } from "next";
import Link from "next/link";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];
const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";
export default async function SpeechesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const categoriesSel = toArr(searchParams.debate_category);
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const match: any = {};
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
  if (partiesSel.length) match["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    match["talker_info.electorate"] = { $in: electoratesSel };
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
  const db = await getDb();
  const pipeline: any[] = [
    {
      $lookup: {
        from: "talkers",
        localField: "talker_id",
        foreignField: "id",
        as: "talker_info",
      },
    },
    { $unwind: "$talker_info" },
    { $match: match },
    { $sort: { date: -1, speech_id: 1, seq: 1 } },
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
    { $sort: { date: -1 } },
    { $limit: 200 },
  ];
  const summaries = (await db
    .collection("speeches")
    .aggregate(pipeline)
    .toArray()) as any[];

  const talkerIds = Array.from(
    new Set(
      summaries
        .flatMap((s) => [s.main_talker_id, ...(s.talker_ids || [])])
        .filter(Boolean)
    )
  );
  const talkerDocs = (await db
    .collection("talkers")
    .find({ id: { $in: talkerIds } }, { projection: { _id: 0 } })
    .toArray()) as unknown as Talker[];
  const talkerMap = new Map<string, Talker>(talkerDocs.map((t) => [t.id!, t]));

  if (summaries.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No speeches found for current filters.
      </p>
    );
  }
  return (
    <div>
      {summaries.map((s) => {
        const mainTalker = s.main_talker_id
          ? talkerMap.get(s.main_talker_id)
          : undefined;
        const snippet = (s.first_content || "").slice(0, 120);
        const href = `/speeches/${encodeURIComponent(s.speech_id)}`;
        return (
          <Link key={s.speech_id} href={href as Route}>
            <div className="hover:cursor-pointer flex flex-col gap-2 p-2 border-b">
              <div className="flex flex-col gap-1">
                {mainTalker && (
                  <SpeakerTitle
                    name={mainTalker.name}
                    electorate={mainTalker.electorate}
                    date={s.date}
                  />
                )}
                <div className="hover:underline flex justify-between items-baseline text-3xl">
                  <strong>{s.debate_title || "Speech"}</strong>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge>{s.debate_category}</Badge>
                  {(mainTalker?.party || s.bill_id) && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      {mainTalker?.party && <Badge>{mainTalker.party}</Badge>}
                    </div>
                  )}
                  <HouseBadge chamber="house" />
                </div>
              </div>
              <div className="whitespace-pre-wrap">
                {`${snippet}${(s.first_content?.length || 0) > 240 ? "…" : ""}`}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
