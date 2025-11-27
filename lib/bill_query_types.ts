import { AnyPart, SpeechPartWithTalkerInfo } from "../types";
import { Tone } from "./speech_tone";

export type PartySpeechCountsResult = {
  party: string;
  count: number;
};

export type PartySpeechProportionsResult = Record<string, number>;


export type SpeakersResult = {
  id: string;
  name: string;
  party: string;
  count: number;
  house: "hor" | "senate";
};


export type SpeechesOverTimeResult = {
  date: Date;
  hor?: number;
  senate?: number;
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

type OverTimeRow = { date: Date; hor?: number; senate?: number };
type TopSpeakerRow = SpeakersResult;
type SpeechListRow = { _id: Date; parts: AnyPart[] };
type SentimentRow = SentimentResult;

export type BillOverview = {
  partySpeechProportions: PartySpeechProportionsResult;
  speechesOverTime: OverTimeRow[];
  topSpeakers: TopSpeakerRow[];
  speechList: SpeechListRow[];
  sentiment: SentimentRow[];
};

// Materialized summary (recommended when data changes infrequently)
export type BillOverviewDoc = BillOverview & {
  bill_id: string;
  updatedAt: Date;
};
