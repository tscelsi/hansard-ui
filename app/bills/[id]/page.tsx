import { formatDate, formatDateString } from "@/lib/date";
import { getDb } from "@/lib/mongodb";
import {
  partySpeechCounts,
  PartySpeechProportionsResult,
  speechesOverTime,
  speechList,
  topSpeakers,
} from "@/lib/queries";
import { ChevronRight12Filled } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import Accordion from "components/Accordion";
import { BillListItem } from "components/BillListItem";
import {
  PartySpeechProportionChart,
  SpeechCountOverTimeByPartChart,
} from "components/charts/speechCountOverTime";
import { SpeechListItem } from "components/SpeechListItem";
import { TopSpeakerTable } from "components/tables/TopSpeakerTable";
import Link from "next/link";

type SpeechSummary = {
  speech_id: string;
  date: string;
  debate_title: string;
  talker_ids: string[];
  first_snippet: string;
  subdebate_title?: string | null;
  main_talker_id?: string;
};

type SearchParams = { [key: string]: string | string[] | undefined };

function toStr(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function BillPage({ params }: { params: { id: string } }) {
  const billId = params.id;
  const db = await getDb();
  const [
    partySpeechCountsResult,
    speechesOverTimeResult,
    topSpeakersResult,
    speechListResult,
  ] = await Promise.all([
    partySpeechCounts(db, billId),
    speechesOverTime(db, billId),
    topSpeakers(db, billId),
    speechList(db, billId),
  ]);

  if (!speechListResult.length) {
    return (
      <div className="container">
        <div className="card">
          <a href="/">← Back</a>
          <h1 className="mt-2">Bill {billId}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            No speeches found for this bill.
          </p>
        </div>
      </div>
    );
  }

  const b0 = speechListResult[0].speeches[0];

  let partySpeechProportions: PartySpeechProportionsResult = {};
  if (partySpeechCountsResult) {
    const totalSpeeches = partySpeechCountsResult.reduce(
      (sum, p) => sum + p.count,
      0
    );
    partySpeechProportions = partySpeechCountsResult.reduce((acc, p) => {
      acc[p.party] = totalSpeeches
        ? parseFloat(((p.count / totalSpeeches) * 100).toFixed(2))
        : 0;
      return acc;
    }, {} as PartySpeechProportionsResult);
  }

  console.log(partySpeechProportions);

  return (
    <div className="container">
      <div>
        <ol
          className={clsx(
            "text-xs border-b py-2 px-2 flex items-center gap-1 text-gray-500",
            instrumentSans.className
          )}
        >
          <li>Bills</li>
          <li className="flex">
            <ChevronRight12Filled />
          </li>
          <li className="text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
            {b0.debate_title}
          </li>
        </ol>
      </div>
      <div className="border-b px-2 py-3 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold mb-1">{b0.debate_title}</h1>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b">
        <h2 className="text-2xl font-semibold">Party Speech Proportion</h2>
        <PartySpeechProportionChart data={partySpeechProportions} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b">
        <h2 className="text-2xl font-semibold">Speeches Over Time</h2>
        <SpeechCountOverTimeByPartChart data={speechesOverTimeResult} />
        <p
          className={clsx("text-sm text-light-grey", instrumentSans.className)}
        >
          Speech counts over the last 18 sitting sessions.
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b">
        <h2 className="text-2xl font-semibold">Top Speakers</h2>
        <TopSpeakerTable data={topSpeakersResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b">
        <h2 className="text-2xl font-semibold">Speech List</h2>
          <Accordion
            items={speechListResult.map((el) => ({
              value: formatDate(el._id),
              trigger: formatDate(el._id),
              content: (
                <div className="flex flex-col gap-y-4">
                  {el.speeches.map((speech) => (
                    <Link
                      href={`/speeches/${encodeURIComponent(speech.speech_id)}`}
                      key={speech.speech_id}
                    >
                      <BillListItem
                        speaker={speech.talker_name}
                        category={speech.debate_category}
                        party={speech.talker_party}
                        content={speech.content}
                      />
                    </Link>
                  ))}
                </div>
              ),
            }))}
          />
      </div>
    </div>
  );
}
