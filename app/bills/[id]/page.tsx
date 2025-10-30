import { formatDate } from "@/lib/date";
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
import Badge, { HouseBadge } from "components/Badge";
import { BillListItem } from "components/BillListItem";
import {
  PartySpeechProportionChart,
  SpeechCountOverTimeByPartChart,
} from "components/charts/speechCountOverTime";
import { SpeakerTable } from "components/tables/SpeakerTable";
import Link from "next/link";

export default async function BillPage({ params }: { params: { id: string } }) {
  const billId = params.id;
  const db = await getDb();
  const [
    partySpeechProportions,
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
            href="/bills"
            className={clsx(
              instrumentSans.className,
              "flex text-xs hover:text-dark-text/80 transition"
            )}
          >
            Bills
          </Link>
          <li className="flex">
            <ChevronRight12Filled />
          </li>
          <li className="text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
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
          Speech counts over the last 18 sitting sessions, and any time this
          year that speeches were given.
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Top Speakers</h2>
        <SpeakerTable data={topSpeakersResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Speech List</h2>
        <Accordion
          items={speechListResult.map((el) => ({
            value: formatDate(el._id),
            trigger: formatDate(el._id),
            content: (
              <div className="flex flex-col gap-y-4">
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
                      <div className="bg-link-blue/40 p-2 rounded-md">
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
