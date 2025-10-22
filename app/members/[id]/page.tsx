import { formatDateString } from "@/lib/date";
import { getDb } from "@/lib/mongodb";
import type { SpeechPartWithTalkerInfo } from "@/types/index";
import Badge, { HouseBadge } from "components/Badge";
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
        speech_id: 1,
        seq: 1,
        date: -1,
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
    .collection("speeches")
    .aggregate(pipeline)
    .toArray()) as SpeechPartWithTalkerInfo[];

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
      <div className="card p-2 border-b bg-light-bg text-light-text">
        <h1 className="text-4xl font-bold">{p0.talker_name}</h1>
        <h2>
          <span className="font-medium">Party:</span>{" "}
          {p0.talker_party || "Unknown"} |{" "}
          <span className="font-medium">Electorate:</span>{" "}
          {p0.talker_electorate || "Unknown"}
        </h2>
      </div>
      {parts.map((p) => {
        const snippet = (p.content || "").substring(0, 120);
        const href = `/speeches/${encodeURIComponent(p.speech_id)}`;
        return (
          <Link href={href as Route} key={p.speech_id}>
            <div className="flex flex-col gap-2 border-b p-2">
              <div className="flex flex-col gap-1">
                <span className="">
                  {formatDateString(p.date)}
                </span>
                <div className="hover:underline flex justify-between items-baseline text-3xl">
                  <strong>{p.debate_title || "Speech"}</strong>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge>{p.debate_category}</Badge>
                <Badge>{p.talker_party}</Badge>
                <HouseBadge chamber="house" />
              </div>
              <div className="whitespace-pre-wrap">
                <p>{`${snippet}${
                  (p.content?.length || 0) > 240 ? "…" : ""
                }`}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
