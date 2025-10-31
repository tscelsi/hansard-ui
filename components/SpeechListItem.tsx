import { formatDateString } from "@/lib/date";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import Badge, { HouseBadge } from "./Badge";

export const SpeechListItem = ({
  title,
  speaker,
  category,
  party,
  house,
  content,
  date,
}: {
  title: string;
  speaker?: string;
  category: string;
  party: string;
  house: "hor" | "senate";
  content: string;
  date?: string;
}) => {
  const snippet = content.substring(0, 120);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {speaker && <p className={clsx(instrumentSans.className, "text-xs")}>{speaker}</p>}
        <h2 className="hover:underline flex justify-between items-baseline font-medium text-lg">
          {title}
        </h2>
        <div className="flex flex-wrap gap-1">
          <Badge>{category}</Badge>
          <Badge>{party}</Badge>
          <HouseBadge house={house} />
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm">
        <p>{`${snippet}${(content?.length || 0) > 120 ? "…" : ""}`}</p>
      </div>
      {date && (
        <span
          className={clsx(
            "font-semibold text-xs mt-1",
            instrumentSans.className
          )}
        >
          {formatDateString(date)}
        </span>
      )}
    </div>
  );
};
