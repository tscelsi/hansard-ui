export type Talker = {
  id: string;
  name: string;
  electorate?: string | null;
  party?: string | null;
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
