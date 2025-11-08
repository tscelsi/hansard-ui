import { Tone } from "@/lib/speech_tone";

export type Talker = {
  id: string;
  name: string;
  electorate: string;
  party: string;
  divisiveness: number;
  bill_divisiveness: number;
};

type ChamberType = "main" | "federation" | "unknown";

export type Part = {
  id: string;
  date: Date; // ISO string
  house: "hor" | "senate";
  bill_ids?: string[] | null;
  chamber: ChamberType;
  type: "speech" | "first_reading";
  debate_category: string;
  debate_seq: number;
  subdebate_1_title: string;
  subdebate_1_info: string | null;
  subdebate_1_seq: number | null;
  subdebate_2_title: string | null;
  subdebate_2_info: string | null;
  subdebate_2_seq: number | null;
  stance_thinking: string;
  stance_value: number | null;
};

export type SpeechPartType = "interjection" | "continuation" | "speech";

export type SpeechPart = {
  speech_id: string; // UUID as string
  speech_seq: number;
  part_seq: number;
  talker_id: string;
  speech_content: string;
  speech_part_type: SpeechPartType;
} & Part;

export type SpeechPartWithTalkerInfo = TalkerInfo & SpeechPart;
export type SpeechPartWithTalkerAndStats = SpeechStats & SpeechPartWithTalkerInfo;

export type TalkerInfo = {
  talker_name: string;
  talker_electorate: string;
  talker_party: string;
}

export type SpeechStats = {
  summary?: string;
  stance?: number;
  tone?: Tone[];
};
