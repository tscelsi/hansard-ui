import {
  bill_discussion,
  bills_list,
  divisiveness,
  partySpeechProportions,
  speakers,
} from "@/lib/bills_queries";
import { getDb } from "@/lib/mongodb";
import { Info16Regular } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { BillsCarousel } from "components/BillsCarousel";
import { PartySpeechProportionChart } from "components/charts/speechCountOverTime";
import { BillsListTable } from "components/tables/BillsListTable";
import { DivisivenessTable } from "components/tables/DivisivenessTable";
import { SpeakerTable } from "components/tables/SpeakerTable";
import Tooltip from "components/Tooltip";

// Quick and simple Bill type
interface Bill {
  id: string;
  date: Date;
  title: string;
}

export default async function BillsPage() {
  const db = await getDb();
  const [
    billsDiscussionResult,
    speakersResult,
    divisivenessResult,
    partySpeechProportionsResult,
    billsListResult,
  ] = await Promise.all([
    bill_discussion(db, [], [], "", ""),
    speakers(db, [], [], "", ""),
    divisiveness(db, [], [], "", ""),
    partySpeechProportions(db, [], [], "", ""),
    bills_list(db, [], [], "", ""),
  ]);

  let largestProportionParty = Object.keys(partySpeechProportionsResult)[0];
  let largestProportion = Object.values(partySpeechProportionsResult)[0];
  let secondLargestParty = Object.keys(partySpeechProportionsResult)[1];
  let secondLargestProportion = Object.values(partySpeechProportionsResult)[1];

  return (
    <div className="container">
      <div>
        <ol
          className={clsx(
            "text-xs border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500",
            instrumentSans.className
          )}
        >
          <li className="text-light-text dark:text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
            Bills
          </li>
        </ol>
      </div>
      <div className="border-b border-dark-grey px-2 py-4 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Bills</h1>
        <h2 className={clsx(instrumentSans.className, "text-sm")}>
          An overview of discussion in parliament relating to bills.
        </h2>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Party Speech Proportion</h2>
        <PartySpeechProportionChart data={partySpeechProportionsResult} />
        <p
          className={clsx("text-sm text-light-grey", instrumentSans.className)}
        >
          {largestProportionParty} has largest proportion of speeches with{" "}
          {largestProportion}%. {secondLargestParty} is second with{" "}
          {secondLargestProportion}%.
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Bill Discussion</h2>
        <BillsCarousel data={billsDiscussionResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Speakers</h2>
        <SpeakerTable data={speakersResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <div className="flex items-center gap-1">
          <h2 className="text-2xl font-semibold">Divisiveness</h2>
          <Tooltip trigger={<Info16Regular className="text-light-text dark:text-light-grey" />}>
            <p className={clsx(instrumentSans.className)}>
              Calculated based on an analysis of a speaker's sentiment and how
              often interjections occur in their speeches,{" "}
              <em className="font-semibold">Divisiveness</em> helps to
              understand how polarising a speaker is. The higher the score, the
              more negative and interjection-heavy their speeches are. This{" "}
              <em className="font-semibold">Divisiveness</em> score is
              calculated specifically for bill discussion.
            </p>
          </Tooltip>
        </div>
        <DivisivenessTable data={divisivenessResult} />
      </div>
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-dark-grey">
        <h2 className="text-2xl font-semibold">Bills List</h2>
        <BillsListTable data={billsListResult} />
      </div>
    </div>
  );
}
