import { Db } from "mongodb";
import { SpeakersResult } from "./bill_query_types";

export type BillDiscussionType = {
  bill_id: string;
  bill_title: string;
  speech_count: number;
  talker_ids: string[];
  latest_speech_date: Date;
};

const createFilter = (
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  let filter: any = {};
  if (parties.length) filter["talker_info.party"] = { $in: parties };
  if (house.length) filter.house = { $in: house };
  const range: any = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  if (Object.keys(range).length) filter.date = range;
  return filter;
};

export type PartySpeechProportionsResult = Record<string, number>;
export type PartySpeechCountsResult = {
  party: string;
  count: number;
};

export const partySpeechProportions = async (
  db: Db,
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  const filter = createFilter(parties, house, from, to);
  const result = await db
    .collection("parts")
    .aggregate<PartySpeechCountsResult>([
      {
        $match: {
          ...filter,
          part_seq: 0,
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
      {
        $sort: {
          count: -1,
        },
      },
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

export const bill_discussion = (
  db: Db,
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  const filter = createFilter(parties, house, from, to);

  return db
    .collection("parts")
    .aggregate<BillDiscussionType>([
      {
        $match: {
          part_seq: 0,
          $and: [{ bill_ids: { $ne: null } }, { bill_ids: { $ne: "" } }],
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
      { $unwind: "$bill_ids" },
      { $match: filter },
      {
        $addFields: {
          title_len: { $strLenCP: "$subdebate_1_title" },
        },
      },
      {
        $sort: {
          title_len: 1,
        },
      },
      { $sort: { title_len: 1 } },
      {
        $group: {
          _id: {
            bill_ids: "$bill_ids",
          },
          bill_title: { $first: "$subdebate_1_title" },
          speech_count: { $sum: 1 },
          talker_ids: { $addToSet: "$talker_id" },
          latest_speech_date: { $max: "$date" },
        },
      },
      {
        $project: {
          _id: 0,
          bill_id: "$_id.bill_ids",
          bill_title: 1,
          speech_count: 1,
          talker_ids: 1,
          latest_speech_date: 1,
        },
      },
      {
        $sort: {
          speech_count: -1,
          latest_speech_date: -1,
        },
      },
      { $limit: 10 },
    ])
    .toArray();
};

export const speakers = (
  db: Db,
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  const filter = createFilter(parties, house, from, to);
  return db
    .collection("parts")
    .aggregate<SpeakersResult>([
      {
        $match: {
          part_seq: 0,
        },
      },
      {
        $group: {
          _id: "$talker_id",
          speech_count: {
            $sum: 1,
          },
          house: { $first: "$house" },
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
      { $match: filter },
      {
        $project: {
          id: "$_id",
          name: "$talker_info.name",
          party: "$talker_info.party",
          count: "$speech_count",
          house: 1,
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
};

export type DivisivenessResult = {
  id: string;
  name: string;
  party: string;
  divisiveness: number;
  house: "hor" | "senate";
};

export const divisiveness = (
  db: Db,
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  const filter = createFilter(parties, house, from, to);
  return db
    .collection("parts")
    .aggregate<DivisivenessResult>([
      {
        $match: {
          part_seq: 0,
          $and: [{ bill_ids: { $ne: null } }, { bill_ids: { $ne: "" } }],
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
          _id: {
            talker_id: "$talker_info.id",
          },
          name: { $first: "$talker_info.name" },
          party: { $first: "$talker_info.party" },
          divisiveness: {
            $first: "$talker_info.bill_divisiveness",
          },
          house: { $first: "$house" },
        },
      },
      { $match: { divisiveness: { $ne: NaN } } },
      {
        $project: {
          _id: 0,
          id: "$_id.talker_id",
          name: 1,
          party: 1,
          house: 1,
          divisiveness: 1,
        },
      },
      {
        $sort: {
          divisiveness: -1,
        },
      },
    ])
    .toArray();
};

export type BillsListResult = {
  id: string;
  bill_title: string;
  latest_date: Date;
  latest_house: "senate" | "hor";
  num_speeches: number;
};

export const bills_list = (
  db: Db,
  parties: string[],
  house: string[],
  from: string,
  to: string
) => {
  const filter = createFilter(parties, house, from, to);
  return db
    .collection("parts")
    .aggregate<BillsListResult>([
      {
        $match: {
          part_seq: 0,
          $and: [{ bill_ids: { $ne: null } }, { bill_ids: { $ne: "" } }],
        },
      },
      {
        $sort: {
          date: -1,
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
      { $unwind: "$bill_ids" },
      { $match: filter },
      {
        $group: {
          _id: "$bill_ids",
          bill_titles: {
            $push: "$subdebate_1_title",
          },
          latest_date: { $first: "$date" },
          latest_house: { $first: "$house" },
          num_speeches: { $sum: 1 },
        },
      },
      {
        $project: {
          id: "$_id",
          bill_title: {
            $reduce: {
              input: "$bill_titles",
              initialValue: "",
              in: {
                $cond: [
                  { $eq: ["$$value", ""] },
                  "$$this",
                  {
                    $cond: [
                      {
                        $lt: [
                          { $strLenCP: "$$this" },
                          { $strLenCP: "$$value" },
                        ],
                      },
                      "$$this",
                      "$$value",
                    ],
                  },
                ],
              },
            },
          },
          latest_date: 1,
          latest_house: 1,
          num_speeches: 1,
        },
      },
      {
        $sort: {
          latest_date: -1,
        },
      },
    ])
    .toArray();
};