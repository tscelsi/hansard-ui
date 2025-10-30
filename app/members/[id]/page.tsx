import { getDb } from "@/lib/mongodb";
import type { SpeechPartWithTalkerInfo } from "@/types/index";
import { ChevronRight12Filled } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { SpeechListItem } from "components/SpeechListItem";
import { Route } from "next";
import Link from "next/link";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id } = params;
  const db = await getDb();
  const categoriesSel = toArr(searchParams.debate_category);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const match: any = { talker_id: id };
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
  const pipeline = [
    {
      $lookup: {
        from: "talkers",
        localField: "talker_id",
        foreignField: "id",
        as: "talker_info",
      },
    },
    { $unwind: "$talker_info" },
    {
      $addFields: {
        talker_party: "$talker_info.party",
        talker_electorate: "$talker_info.electorate",
        talker_name: "$talker_info.name",
      },
    },
    {
      $project: {
        talker_info: 0,
      },
    },
    {
      $match: match,
    },
    {
      $sort: {
        date: -1,
        speech_seq: 1,
      },
    },
    {
      $group: {
        _id: "$speech_id",
        firstPart: {
          $first: "$$ROOT",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$firstPart",
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ];
  const parts = (await db
    .collection("parts")
    .aggregate<SpeechPartWithTalkerInfo>(pipeline)
    .toArray());

  if (!parts.length) {
    return (
      <div className="container">
        <div className="card">
          <p className="muted">No parts found for member {id}.</p>
        </div>
      </div>
    );
  }

  const p0 = parts[0];

  return (
    <div className="container">
      <div>
        <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500">
          <li>
            <Link
              href="/speeches"
              className={clsx(
                instrumentSans.className,
                "flex text-xs hover:text-dark-text/80 transition"
              )}
            >
              Members
            </Link>
          </li>
          <li className="flex">
            <ChevronRight12Filled />
          </li>
          <li className="text-xs text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
            <span className={clsx(instrumentSans.className)}>
              {p0.talker_name}
            </span>
          </li>
        </ol>
      </div>
      <div className="card py-3 px-2 border-b border-dark-grey">
        <h1 className="text-4xl font-semibold">{p0.talker_name}</h1>
        <h2>
          <span className="font-medium">Party:</span>{" "}
          {p0.talker_party || "Unknown"} |{" "}
          <span className="font-medium">Electorate:</span>{" "}
          {p0.talker_electorate || "Unknown"}
        </h2>
      </div>
      {parts.map((p) => {
        const href = `/speeches/${encodeURIComponent(p.speech_id)}`;
        return (
          <Link href={href as Route} key={p.speech_id}>
            <div className="flex flex-col border-b border-dark-grey p-2">
              <SpeechListItem
                title={p.subdebate_1_title || "Speech"}
                category={p.debate_category}
                party={p.talker_party}
                house={p.house}
                content={p.speech_content || ""}
                date={p.date}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
