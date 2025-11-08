import { getDb } from "@/lib/mongodb";
import type { SpeechPartWithTalkerAndStats } from "@/types/index";
import Badge, { HouseBadge, IconBadge } from "components/Badge";
import clsx from "clsx";
import { formatDate, formatDateString } from "@/lib/date";
import {
  ArrowUpRight12Filled,
  ChevronRight12Filled,
  Info12Regular,
  Info16Regular,
  Location12Regular,
  Sparkle16Filled,
  Sparkle20Filled,
} from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import Link from "next/link";
import Tooltip from "components/Tooltip";

const stanceToLabel = (stance: number) => {
  if (stance > 0.2) return "In Favor";
  if (stance < -0.2) return "Against";
  return "Neutral";
};

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
      $lookup: {
        from: "speech_stats",
        localField: "speech_id",
        foreignField: "speech_id",
        as: "speech_stats",
      },
    },
    {
      $unwind: "$talker_info",
    },
    {
      $unwind: {
        path: "$speech_stats",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        part_seq: 1,
      },
    },
    {
      $addFields: {
        talker_party: "$talker_info.party",
        talker_electorate: "$talker_info.electorate",
        talker_name: "$talker_info.name",
        stance: "$speech_stats.stance",
        summary: "$speech_stats.summary",
        tone: "$speech_stats.tone",
      },
    },
    {
      $project: {
        talker_info: 0,
        speech_stats: 0,
        _id: 0,
      },
    },
  ];
  const parts = await db
    .collection("parts")
    .aggregate<SpeechPartWithTalkerAndStats>(pipeline)
    .toArray();

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
          <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500">
            <li>
              <Link
                href="/speeches"
                className={clsx(
                  instrumentSans.className,
                  "flex text-xs hover:text-light-text/80 dark:hover:text-dark-text/80 transition"
                )}
              >
                Speeches
              </Link>
            </li>
            <li className="flex">
              <ChevronRight12Filled />
            </li>
            <li className="text-xs text-light-text dark:text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
              <span className={clsx(instrumentSans.className)}>{title}</span>
            </li>
          </ol>
        </div>
        <div className="border-b border-dark-grey p-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="font-medium">{p0.talker_name}</p>
            {p0.bill_ids && p0.bill_ids.length > 0 && (
              <Link
                href={`/bills/details/${encodeURIComponent(p0.bill_ids[0])}`}
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
            {formatDate(p0.date)}
          </span>
        </div>
      </div>
      <div>
        <div className="flex gap-1 p-2 border-b border-dark-grey flex-wrap">
          <HouseBadge house={p0.house} />
          {p0?.stance && (
            <IconBadge
              icon={
                <Tooltip
                  trigger={
                    <Info12Regular className="text-light-text dark:text-light-grey" />
                  }
                >
                  <p
                    className={clsx(
                      instrumentSans.className,
                      "text-sm flex flex-col gap-2"
                    )}
                  >
                    <span>
                      The stance the speaker is taking in this speech, as
                      determined by an AI language model.
                    </span>
                  </p>
                </Tooltip>
              }
            >
              {stanceToLabel(p0.stance)}
            </IconBadge>
          )}
          {p0?.tone &&
            p0.tone.map((el) => (
              <Badge>{el.slice(0, 1).toUpperCase() + el.slice(1)}</Badge>
            ))}
        </div>
        {p0?.summary && (
          <div className="border-b border-dark-grey flex flex-col gap-2 p-2">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold">Summary</h2>
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
                    This summary was generated by an AI language model. It may
                    not be completely accurate. Use at your own discretion.
                  </span>
                </p>
              </Tooltip>
            </div>
            <p className={clsx(instrumentSans.className, "text-md italic")}>
              {p0.summary}
            </p>
          </div>
        )}
        <ol>
          {parts.map((p) => {
            const who = p.talker_name || p.talker_id;
            return (
              <li key={p.speech_seq}>
                <section
                  id={`${p.speech_seq}`}
                  className="flex flex-col gap-2 border-b border-dark-grey p-2"
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
