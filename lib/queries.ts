import { Db } from "mongodb";
import { SpeechPartWithTalkerInfo } from "../types";

export type PartySpeechCountsResult = {
  party: string;
  count: number;
};

export type PartySpeechProportionsResult = Record<string, number>;

export const partySpeechCounts = (db: Db, bill_id: string) =>
  db
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
    ])
    .toArray();

export type TopSpeakersResult = {
  id: string;
  name: string;
  party: string;
  count: number;
};

export const topSpeakers = (db: Db, bill_id: string) =>
  db
    .collection("parts")
    .aggregate<TopSpeakersResult>([
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
          id: "$_id",
          name: "$talker_info.name",
          party: "$talker_info.party",
          count: "$speech_count",
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
  count: number;
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
    .aggregate<SpeechesOverTimeResult>([
      { $match: { bill_ids: bill_id, speech_seq: 0 } },
      {
        $group: {
          _id: {
            date: "$date",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          count: 1,
        },
      },
    ])
    .toArray();
  // add results for each missing date from the sitting days
  const existingDates = result.map((r) => r.date.toISOString().split("T")[0]);
  latestSittingDays.forEach((date) => {
    const dateStr = date.toISOString().split("T")[0];
    if (!existingDates.includes(dateStr)) {
      result.push({ date: date, count: 0 });
    }
  });
  // sort by date ascending
  result.sort((a, b) => a.date.getTime() - b.date.getTime());

  return result;
};
