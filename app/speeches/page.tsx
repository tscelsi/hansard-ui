import { getDb } from "@/lib/mongodb";
import { Talker } from "@/types/index";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { SpeechListItem } from "components/SpeechListItem";
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
      <div>
        <ol className="border-b py-2 px-2 flex items-center gap-1 text-gray-500">
          <li className="text-xs text-dark-text text-nowrap overflow-hidden text-ellipsis">
            <span className={clsx(instrumentSans.className)}>Speeches</span>
          </li>
        </ol>
      </div>
      {summaries.map((s) => {
        const mainTalker = s.main_talker_id
          ? talkerMap.get(s.main_talker_id)
          : undefined;
        const href = `/speeches/${encodeURIComponent(s.speech_id)}`;
        return (
          <Link key={s.speech_id} href={href as Route}>
            <SpeechListItem
              speaker={mainTalker?.name || undefined}
              title={s.debate_title || "Speech"}
              category={s.debate_category}
              party={mainTalker?.party || "Unknown"}
              content={s.first_content || ""}
              date={s.date}
            />
          </Link>
        );
      })}
    </div>
  );
}
