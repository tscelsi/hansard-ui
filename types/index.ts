export type Talker = {
  id: string;
  name: string;
  electorate: string;
  party: string;
};

type ChamberType = "Main Chamber" | "Federation Chamber" | "Unknown Chamber";

export type Part = {
  id: string;
  date: string; // ISO string
  bill_ids?: string[] | null;
  chamber: ChamberType;
  type: "speech" | "first_reading"
  debate_category: string;
  debate_seq: number;
  subdebate_1_title: string;
  subdebate_1_info: string | null;
  subdebate_1_seq: number | null;
  subdebate_2_title: string | null;
  subdebate_2_info: string | null;
  subdebate_2_seq: number | null;
};


export type SpeechPart = {
  speech_id: string; // UUID as string
  speech_seq: number;
  talker_id: string;
  speech_content: string;
  speech_part_type: 'interjection' | 'continuation' | 'speech';
} & Part

export type SpeechPartWithTalkerInfo = {
  talker_name: string;
  talker_electorate: string;
  talker_party: string;
} & SpeechPart;
