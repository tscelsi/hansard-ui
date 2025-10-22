import { getDb } from "@/lib/mongodb";
import type { SpeechPartWithTalkerInfo } from "@/types/index";
import Badge from "components/Badge";
import clsx from "clsx";
import { formatDateString } from "@/lib/date";
import { Location12Regular } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";

export default async function SpeechPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const db = await getDb();
  const pipeline = [
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
      $match: {
        speech_id: id,
      },
    },
    {
      $sort: {
        seq: 1,
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
    .collection("speeches")
    .aggregate(pipeline)
    .toArray()) as SpeechPartWithTalkerInfo[];

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
  const title = p0?.debate_title || "Speech";
  const dateStr = formatDateString(p0.date);
  const subdebateTitle = p0?.subdebate_title || "";
  const subdebateInfo = p0?.subdebate_info || "";

  return (
    <div className="container">
      <div className="card">
        <div className="border-b p-2">
          <h1 className="text-4xl font-bold mb-1">{title}</h1>
          <div>
            <h4>
              <strong>Primary talker: </strong>
              {p0.talker_name}
            </h4>
            <h4>
              <strong>Date: </strong>
              {dateStr}
            </h4>
            <h4>
              <strong>Category: </strong>
              {p0.debate_category}
            </h4>
            {(subdebateTitle || subdebateInfo) && (
              <h4>
                <strong>Subdebate:</strong> {subdebateTitle || "—"}
                {subdebateInfo && (
                  <span className="muted"> — {subdebateInfo}</span>
                )}
              </h4>
            )}
          </div>
        </div>
      </div>
      <div className="">
        <ol>
          {parts.map((p) => {
            const who = p.talker_name || p.talker_id;
            return (
              <li key={p.seq}>
                <section
                  id={`${p.seq}`}
                  className="flex flex-col gap-2 border-b p-2"
                >
                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-wrap items-center w-full gap-1">
                      <div className="flex gap-1 w-fit mr-1">
                        <a
                          href={`#${p.seq}`}
                          className="muted"
                          title="Link to this part"
                        >
                          ¶
                        </a>
                        <strong className="text-lg font-bold">{who}</strong>
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
                  <div className={clsx("whitespace-pre-wrap text-lg")}>
                    {p.content}
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
