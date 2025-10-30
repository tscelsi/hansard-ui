import { getDb } from "@/lib/mongodb";
import type { SpeechPartWithTalkerInfo } from "@/types/index";
import Badge from "components/Badge";
import clsx from "clsx";
import { formatDateString } from "@/lib/date";
import {
  ArrowUpRight12Filled,
  ChevronRight12Filled,
  Location12Regular,
} from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import Link from "next/link";

export default async function SpeechPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const db = await getDb();
  const pipeline = [
    {
      $match: {
        speech_id: id,
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
    {
      $unwind: "$talker_info",
    },
    {
      $sort: {
        speech_seq: 1,
      },
    },
    {
      $addFields: {
        talker_party: "$talker_info.party",
        talker_electorate: "$talker_info.electorate",
        talker_name: "$talker_info.name",
      },
    },
    {
      $project: {
        talker_info: 0,
      },
    },
  ];
  const parts = (await db
    .collection("parts")
    .aggregate<SpeechPartWithTalkerInfo>(pipeline)
    .toArray());

  if (!parts.length) {
    return (
      <div className="container">
        <div className="card">
          <p className="muted">No parts found for speech {id}.</p>
        </div>
      </div>
    );
  }

  const p0 = parts[0];
  const title = p0?.subdebate_1_title || "Speech";
  const subdebateTitle = p0?.subdebate_2_title || "";

  let subtitleHeader = p0.debate_category;
  if (subdebateTitle) {
    subtitleHeader = `${p0.debate_category} / ${subdebateTitle}`;
  }

  return (
    <div className="container">
      <div>
        <div>
          <ol className="border-b py-2 px-2 flex items-center gap-1 text-gray-500">
            <li>
              <Link
                href="/speeches"
                className={clsx(
                  instrumentSans.className,
                  "flex text-xs hover:text-dark-text/80 transition"
                )}
              >
                Speeches
              </Link>
            </li>
            <li className="flex">
              <ChevronRight12Filled />
            </li>
            <li className="text-xs text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
              <span className={clsx(instrumentSans.className)}>{title}</span>
            </li>
          </ol>
        </div>
        <div className="border-b p-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="font-medium">{p0.talker_name}</p>
            {p0.bill_ids && p0.bill_ids.length > 0 && (
              <Link
                href={`/bills/${encodeURIComponent(p0.bill_ids[0])}`}
                className="flex gap-1 text-link-blue hover:underline hover:cursor-pointer"
              >
                <span className="text-xs">Go to bill</span>
                <ArrowUpRight12Filled />
              </Link>
            )}
          </div>
          <h1 className="text-4xl font-semibold">{title}</h1>
          <div>
            <h2 className="font-bold">{subtitleHeader}</h2>
            {p0.subdebate_2_info && <p>{p0.subdebate_2_info}</p>}
          </div>
          <span className={clsx("text-sm mt-2", instrumentSans.className)}>
            {formatDateString(p0.date)}
          </span>
        </div>
      </div>
      <div>
        <ol>
          {parts.map((p) => {
            const who = p.talker_name || p.talker_id;
            return (
              <li key={p.speech_seq}>
                <section
                  id={`${p.speech_seq}`}
                  className="flex flex-col gap-2 border-b p-2"
                >
                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-wrap items-center w-full gap-1">
                      <div className="flex items-center gap-1 w-fit mr-1">
                        <a
                          href={`#${p.speech_seq}`}
                          className="muted"
                          title="Link to this part"
                        >
                          ¶
                        </a>
                        <strong className="tracking-wide font-semibold">
                          {who}
                        </strong>
                      </div>
                      {p.talker_party && <Badge>{p.talker_party}</Badge>}
                      {p.talker_electorate && (
                        <Badge>
                          <Location12Regular />
                          {p.talker_electorate}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={clsx("tracking-wide whitespace-pre-wrap")}>
                    <p>{p.speech_content}</p>
                  </div>
                </section>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
