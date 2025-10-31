import { formatDateString } from "@/lib/date";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import Badge, { HouseBadge, IconBadge } from "./Badge";
import { Location12Regular } from "@fluentui/react-icons";
import { SpeechPartType } from "../types";

export const SpeechListItem = ({
  title,
  speaker,
  category,
  party,
  electorate,
  house,
  type,
  content,
  date,
}: {
  title: string;
  speaker?: string;
  category: string;
  party: string;
  house: "hor" | "senate";
  content: string;
  electorate?: string;
  type?: SpeechPartType;
  date?: string;
}) => {
  const snippet = content.substring(0, 120);
  return (
    <div className="flex flex-col gap-2">
      {speaker && (
        <p
          className={clsx(instrumentSans.className, "text-xs text-light-grey")}
        >
          {speaker}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="hover:underline flex justify-between items-baseline font-medium text-xl">
          {title}
        </h2>
        <div className="flex flex-wrap gap-1">
          <Badge>{party}</Badge>
          <Badge>{category}</Badge>
          {electorate && (
            <IconBadge icon={<Location12Regular />}>{electorate}</IconBadge>
          )}
          <HouseBadge house={house} />
          {type && <Badge>{type.replace(/^\w/, (c) => c.toUpperCase())}</Badge>}
        </div>
      </div>
      <div className="whitespace-pre-wrap">
        <p>{`${snippet}${(content?.length || 0) > 120 ? "…" : ""}`}</p>
      </div>
      {date && (
        <span
          className={clsx(
            "font-semibold text-xs mt-2",
            instrumentSans.className
          )}
        >
          {formatDateString(date)}
        </span>
      )}
    </div>
  );
};
