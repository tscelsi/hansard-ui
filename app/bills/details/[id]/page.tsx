import { formatDate } from "@/lib/date";
import { getDb } from "@/lib/mongodb";
import { BillOverviewDoc } from "@/lib/bill_query_types";
import { ChevronRight12Filled, Info16Regular } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import Accordion from "components/Accordion";
import Badge, { HouseBadge } from "components/Badge";
import { BillListItem } from "components/BillListItem";
import { BillSentimentChart } from "components/charts/billSentimentChart";
import {
  PartySpeechProportionChart,
  SpeechCountOverTimeByPartChart,
} from "components/charts/speechCountOverTime";
import Menu from "components/Menu";
import { SpeakerTable } from "components/tables/SpeakerTable";
import Link from "next/link";
import Tooltip from "components/Tooltip";

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

export type SentimentGroupByType = "speech" | "member" | "party";

const castToSentimentGroupByValue = (groupBy: string) => {
  if (groupBy === "speech" || groupBy === "member" || groupBy === "party") {
    return groupBy;
  }
  return "speech";
};

export default async function BillPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const billId = params.id;
  const db = await getDb();
  const sentimentGroupBy = castToSentimentGroupByValue(
    toStr(searchParams.sentimentGroupBy)
  );
  const summary = await db.collection<BillOverviewDoc>("bill_overview").findOne({ bill_id: billId });
  if (!summary) {
    return (
      <div className="container">
        <div className="card">
          <Link href="/" className={clsx(instrumentSans.className, "text-link-blue text-sm hover:underline")}>Home</Link>
          <h1 className="mt-2">Bill {billId}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            No data found for this bill.
          </p>
        </div>
      </div>
    );
  }
  const {
    partySpeechProportions,
    speechesOverTime: speechesOverTimeResult,
    topSpeakers: topSpeakersResult,
    speechList: speechListResult,
    sentiment: sentimentResult,
  } = summary;

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

  const b0 = speechListResult[speechListResult.length - 1].parts[0];

  const largestProportion = Object.entries(partySpeechProportions).reduce(
    (acc, [party, proportion]) => {
      // get the max proportion and party
      if (proportion > acc.proportion) {
        acc = { party, proportion };
      }
      return acc;
    },
    { party: "", proportion: 0 }
  );

  return (
    <div className="container">
      <div>
        <ol
          className={clsx(
            "text-xs border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500",
            instrumentSans.className
          )}
        >
          <Link
            href="/bills/summary"
            className={clsx(
              instrumentSans.className,
              "flex text-xs hover:text-light-text/80 dark:hover:text-dark-text/80 transition"
            )}
          >
            Bills
          </Link>
          <li className="flex">
            <ChevronRight12Filled />
          </li>
          <li className="text-light-text dark:text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
            {b0.subdebate_1_title}
          </li>
        </ol>
      </div>
      <div className="border-b border-dark-grey px-2 py-3 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">{b0.subdebate_1_title}</h1>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Party Speech Proportion</h2>
        <PartySpeechProportionChart data={partySpeechProportions} />
        <p
          className={clsx("text-sm text-light-grey", instrumentSans.className)}
        >
          {largestProportion.party} has largest proportion of speeches with{" "}
          {largestProportion.proportion}%.
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Speeches Over Time</h2>
        <SpeechCountOverTimeByPartChart data={speechesOverTimeResult} />
        <p
          className={clsx("text-sm text-light-grey", instrumentSans.className)}
        >
          Speech counts over the last 18 days, as well as any time speeches were given
          during the lifetime of the bill.
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Top Speakers</h2>
        <SpeakerTable data={topSpeakersResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <div className="flex justify-between">
          <div className="flex items-center gap-1">
            <h2 className="text-2xl font-semibold flex items-center">
              Bill Sentiment
            </h2>
            <Tooltip
              trigger={
                <Info16Regular className="text-light-text dark:text-light-grey" />
              }
            >
              <p
                className={clsx(
                  instrumentSans.className,
                  "text-sm flex flex-col gap-2"
                )}
              >
                <span>
                  <strong>
                    <em>Stance</em>
                  </strong>{" "}
                  (x-axis) is a number between -1 and 1. It measures support toward the
                  bill under discussion. Complete support receives a value of 1
                  and being completely against -1.
                </span>

                <span>
                  <strong>
                    <em>Tone</em>
                  </strong>{" "}
                  (y-axis) is a number between 0 and 1. It is a measure of the positive
                  language used in speeches. Very positive language is scored 1
                  and very negative and aggressive language is scored 0.
                </span>
                <span className="text-light-grey">
                  <strong>NOTE:</strong> The textual analysis that provides
                  these scores was generated by an LLM, and is currently only supported
                  for speeches in the house of representatives.
                </span>
              </p>
            </Tooltip>
          </div>
          <Menu defaultValue={sentimentGroupBy} />
        </div>
        <BillSentimentChart data={sentimentResult} groupBy={sentimentGroupBy} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Timeline</h2>
        <Accordion
          items={speechListResult.map((el) => ({
            value: formatDate(el._id),
            trigger: formatDate(el._id),
            content: (
              <div key={el._id.toISOString()} className="flex flex-col gap-y-4">
                {el.parts.map((part) => {
                  if (part.type === "speech") {
                    return (
                      <Link
                        href={`/speeches/${encodeURIComponent(part.speech_id)}`}
                        key={part.speech_id}
                      >
                        <BillListItem
                          speaker={part.talker_name}
                          category={part.debate_category}
                          electorate={part.talker_electorate}
                          party={part.talker_party}
                          content={part.speech_content}
                          house={part.house}
                          chamber={part.chamber}
                        />
                      </Link>
                    );
                  } else if (part.type === "first_reading") {
                    return (
                      <div key={part.id} className="bg-link-blue/40 p-2 rounded-md">
                        <h2 className="flex justify-between items-baseline font-medium text-lg">
                          {part.subdebate_1_title}
                        </h2>
                        <div className="flex flex-wrap gap-1">
                          <Badge>First Reading</Badge>
                          <HouseBadge house={part.house} />
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}
