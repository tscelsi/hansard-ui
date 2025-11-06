import { Db } from "mongodb";
import { SpeechPartWithTalkerInfo } from "../types";
import { Tone } from "./speech_tone";

export type PartySpeechCountsResult = {
  party: string;
  count: number;
};

export type PartySpeechProportionsResult = Record<string, number>;

export const partySpeechCounts = async (db: Db, bill_id: string) => {
  const result = await db
    .collection("parts")
    .aggregate<PartySpeechCountsResult>([
      {
        $match: {
          bill_ids: bill_id,
          speech_seq: 0,
        },
      },
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
        $group: {
          _id: "$talker_info.party",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          party: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();
  let partySpeechProportions: PartySpeechProportionsResult = {};
  if (result) {
    const totalSpeeches = result.reduce((sum, p) => sum + p.count, 0);
    partySpeechProportions = result.reduce((acc, p) => {
      acc[p.party] = totalSpeeches
        ? parseFloat(((p.count / totalSpeeches) * 100).toFixed(2))
        : 0;
      return acc;
    }, {} as PartySpeechProportionsResult);
  }
  return partySpeechProportions;
};

export type SpeakersResult = {
  id: string;
  name: string;
  party: string;
  count: number;
  house: "hor" | "senate";
  stance_value: number | null;
  stance_thinking: string;
};

export const topSpeakers = (db: Db, bill_id: string) =>
  db
    .collection("parts")
    .aggregate<SpeakersResult>([
      {
        $match: {
          bill_ids: bill_id,
          speech_seq: 0,
        },
      },
      {
        $group: {
          _id: "$talker_id",
          speech_count: {
            $sum: 1,
          },
          house: { $first: "$house" },
          stance_value: { $first: "$stance_value" },
          stance_thinking: { $first: "$stance_thinking" },
        },
      },
      {
        $lookup: {
          from: "talkers",
          localField: "_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      { $unwind: "$talker_info" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$talker_info.name",
          party: "$talker_info.party",
          count: "$speech_count",
          house: 1,
          stance_value: 1,
          stance_thinking: 1,
        },
      },
      {
        $sort: {
          count: -1,
          name: 1,
        },
      },
    ])
    .toArray();

export const speechList = (db: Db, bill_id: string) =>
  db
    .collection("parts")
    .aggregate<{ _id: Date; parts: SpeechPartWithTalkerInfo[] }>([
      {
        $match: {
          bill_ids: bill_id,
          $or: [{ speech_seq: 0 }, { type: "first_reading" }],
        },
      },
      {
        $sort: {
          date: 1,
          debate_seq: 1,
          subdebate_1_seq: 1,
          subdebate_2_seq: 1,
          speech_seq: 1,
        },
      },
      {
        $lookup: {
          from: "talkers",
          localField: "talker_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      {
        $addFields: {
          talker_name: {
            $ifNull: [
              {
                $arrayElemAt: ["$talker_info.name", 0],
              },
              null,
            ],
          },
          talker_party: {
            $ifNull: [
              {
                $arrayElemAt: ["$talker_info.party", 0],
              },
              null,
            ],
          },
          talker_electorate: {
            $ifNull: [
              {
                $arrayElemAt: ["$talker_info.electorate", 0],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          talker_info: 0,
        },
      },
      {
        $group: {
          _id: "$date",
          parts: {
            $push: "$$ROOT",
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ])
    .toArray();

export type SpeechesOverTimeResult = {
  date: Date;
  hor?: number;
  senate?: number;
};

const latestSittingDays = [
  new Date("2025-10-09"),
  new Date("2025-10-08"),
  new Date("2025-10-07"),
  new Date("2025-09-04"),
  new Date("2025-09-03"),
  new Date("2025-09-02"),
  new Date("2025-09-01"),
  new Date("2025-08-28"),
  new Date("2025-08-27"),
  new Date("2025-08-26"),
  new Date("2025-08-25"),
  new Date("2025-07-31"),
  new Date("2025-07-30"),
  new Date("2025-07-29"),
  new Date("2025-07-28"),
  new Date("2025-06-24"),
  new Date("2025-06-23"),
  new Date("2025-06-22"),
];

export const speechesOverTime = async (db: Db, bill_id: string) => {
  const result = await db
    .collection("parts")
    .aggregate<{ date: Date; hor?: number; senate?: number }>([
      { $match: { bill_ids: bill_id, speech_seq: 0 } },
      {
        $group: {
          _id: {
            date: "$date",
            house: "$house",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          counts: {
            $push: {
              k: "$_id.house",
              v: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          counts: 1,
        },
      },
      {
        $addFields: {
          countsObj: {
            $arrayToObject: "$counts",
          },
        },
      },
      {
        $project: {
          date: 1,
          hor: "$countsObj.hor",
          senate: "$countsObj.senate",
        },
      },
    ])
    .toArray();
  // add results for each missing date from the sitting days
  const existingDates = new Set(
    result.map((r) => r.date.toISOString().split("T")[0])
  );
  const today = new Date();
  const accumulator = new Date();
  accumulator.setDate(today.getDate() - 18);
  while (accumulator <= today) {
    const dateStr = accumulator.toISOString().split("T")[0];
    if (!existingDates.has(dateStr)) {
      result.push({ date: new Date(dateStr), hor: 0, senate: 0 });
    }
    accumulator.setDate(accumulator.getDate() + 1);
  }
  // sort by date ascending
  result.sort((a, b) => a.date.getTime() - b.date.getTime());

  return result;
};

export type SentimentResult = {
  talker_id: string;
  speech_id: string;
  name: string;
  party: string;
  electorate: string;
  house: "hor" | "senate";
  stance: number;
  tone: Tone[];
};

export const sentiment = (db: Db, bill_id: string) =>
  db
    .collection("parts")
    .aggregate<SentimentResult>([
      {
        $match: {
          bill_ids: bill_id,
          speech_seq: 0,
        },
      },
      {
        $sort: {
          date: 1,
          debate_seq: 1,
          subdebate_1_seq: 1,
          subdebate_2_seq: 1,
          speech_seq: 1,
        },
      },
      {
        $lookup: {
          from: "talkers",
          localField: "talker_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      {
        $lookup: {
          from: "speech_stats",
          localField: "speech_id",
          foreignField: "id",
          as: "speech_stats",
        },
      },
      {
        $unwind: {
          path: "$talker_info",
        },
      },
      {
        $unwind: {
          path: "$speech_stats",
        },
      },
      {
        $project: {
          _id: 0,
          talker_id: 1,
          speech_id: 1,
          name: "$talker_info.name",
          party: "$talker_info.party",
          electorate: "$talker_info.electorate",
          house: 1,
          stance: "$speech_stats.stance",
          tone: "$speech_stats.tone",
        },
      },
    ])
    .toArray();

// Combined fetch to reduce round-trips using a single aggregation with $facet
type PartyCount = { party: string; count: number };
type OverTimeRow = { date: Date; hor?: number; senate?: number };
type TopSpeakerRow = SpeakersResult;
type SpeechListRow = { _id: Date; parts: SpeechPartWithTalkerInfo[] };
type SentimentRow = SentimentResult;

export type BillOverview = {
  partySpeechProportions: PartySpeechProportionsResult;
  speechesOverTime: OverTimeRow[];
  topSpeakers: TopSpeakerRow[];
  speechList: SpeechListRow[];
  sentiment: SentimentRow[];
};

export async function billOverview(db: Db, bill_id: string): Promise<BillOverview> {
  const [res] = await db
    .collection("parts")
    .aggregate<{
      partyCounts: PartyCount[];
      topSpeakers: TopSpeakerRow[];
      overTime: OverTimeRow[];
      speechList: SpeechListRow[];
      sentiment: SentimentRow[];
    }>([
      {
        $match: {
          bill_ids: bill_id,
        },
      },
      {
        $facet: {
          partyCounts: [
            { $match: { speech_seq: 0 } },
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
              $group: {
                _id: "$talker_info.party",
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, party: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
          topSpeakers: [
            { $match: { speech_seq: 0 } },
            {
              $group: {
                _id: "$talker_id",
                speech_count: { $sum: 1 },
                house: { $first: "$house" },
                stance_value: { $first: "$stance_value" },
                stance_thinking: { $first: "$stance_thinking" },
              },
            },
            {
              $lookup: {
                from: "talkers",
                localField: "_id",
                foreignField: "id",
                as: "talker_info",
              },
            },
            { $unwind: "$talker_info" },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: "$talker_info.name",
                party: "$talker_info.party",
                count: "$speech_count",
                house: 1,
                stance_value: 1,
                stance_thinking: 1,
              },
            },
            { $sort: { count: -1, name: 1 } },
          ],
          overTime: [
            { $match: { speech_seq: 0 } },
            {
              $group: {
                _id: { date: "$date", house: "$house" },
                count: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: "$_id.date",
                counts: { $push: { k: "$_id.house", v: "$count" } },
              },
            },
            { $project: { _id: 0, date: "$_id", counts: 1 } },
            { $addFields: { countsObj: { $arrayToObject: "$counts" } } },
            { $project: { date: 1, hor: "$countsObj.hor", senate: "$countsObj.senate" } },
          ],
          speechList: [
            { $match: { $or: [{ speech_seq: 0 }, { type: "first_reading" }] } },
            { $sort: { date: 1, debate_seq: 1, subdebate_1_seq: 1, subdebate_2_seq: 1, speech_seq: 1 } },
            {
              $lookup: {
                from: "talkers",
                localField: "talker_id",
                foreignField: "id",
                as: "talker_info",
              },
            },
            {
              $addFields: {
                talker_name: { $ifNull: [{ $arrayElemAt: ["$talker_info.name", 0] }, null] },
                talker_party: { $ifNull: [{ $arrayElemAt: ["$talker_info.party", 0] }, null] },
                talker_electorate: { $ifNull: [{ $arrayElemAt: ["$talker_info.electorate", 0] }, null] },
              },
            },
            { $project: { talker_info: 0 } },
            { $group: { _id: "$date", parts: { $push: "$$ROOT" } } },
            { $sort: { _id: -1 } },
          ],
          sentiment: [
            { $match: { speech_seq: 0 } },
            { $sort: { date: 1, debate_seq: 1, subdebate_1_seq: 1, subdebate_2_seq: 1, speech_seq: 1 } },
            {
              $lookup: {
                from: "talkers",
                localField: "talker_id",
                foreignField: "id",
                as: "talker_info",
              },
            },
            { $unwind: { path: "$talker_info" } },
            {
              $lookup: {
                from: "speech_stats",
                localField: "speech_id",
                foreignField: "id",
                as: "speech_stats",
              },
            },
            { $unwind: { path: "$speech_stats" } },
            {
              $project: {
                _id: 0,
                talker_id: 1,
                speech_id: 1,
                name: "$talker_info.name",
                party: "$talker_info.party",
                electorate: "$talker_info.electorate",
                house: 1,
                stance: "$speech_stats.stance",
                tone: "$speech_stats.tone",
              },
            },
          ],
        },
      },
    ])
    .toArray();

  const partySpeechProportions: PartySpeechProportionsResult = (() => {
    const counts = res?.partyCounts ?? [];
    const total = counts.reduce((s, r) => s + r.count, 0);
    return counts.reduce((acc, r) => {
      acc[r.party] = total ? parseFloat(((r.count / total) * 100).toFixed(2)) : 0;
      return acc;
    }, {} as PartySpeechProportionsResult);
  })();

  // Fill missing dates (last 18 days) for overTime
  const overTime = (res?.overTime ?? []).slice();
  const existing = new Set(overTime.map((r) => r.date.toISOString().split("T")[0]));
  const today = new Date();
  const acc = new Date();
  acc.setDate(today.getDate() - 18);
  while (acc <= today) {
    const ds = acc.toISOString().split("T")[0];
    if (!existing.has(ds)) overTime.push({ date: new Date(ds), hor: 0, senate: 0 });
    acc.setDate(acc.getDate() + 1);
  }
  overTime.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    partySpeechProportions,
    speechesOverTime: overTime,
    topSpeakers: res?.topSpeakers ?? [],
    speechList: res?.speechList ?? [],
    sentiment: res?.sentiment ?? [],
  };
}
