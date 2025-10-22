export type Talker = {
  id: string;
  name: string;
  electorate: string;
  party: string;
};

export type SpeechPart = {
  speech_id: string; // UUID as string
  talker_id: string;
  bill_id?: string | null;
  seq: number;
  content: string;
  type: 'interjection' | 'continuation' | 'speech';
  debate_category: string;
  debate_title: string;
  debate_info?: string | null;
  subdebate_title?: string | null;
  subdebate_info?: string | null;
  date: string; // ISO string
};


export type SpeechPartWithTalkerInfo = {
  speech_id: string; // UUID as string
  talker_id: string;
  talker_name: string;
  talker_electorate: string;
  talker_party: string;
  bill_id?: string | null;
  seq: number;
  content: string;
  type: 'interjection' | 'continuation' | 'speech';
  debate_category: string;
  debate_title: string;
  debate_info?: string | null;
  subdebate_title?: string | null;
  subdebate_info?: string | null;
  date: string; // ISO string
};
