import Badge, { HouseBadge } from "./Badge";

export const BillListItem = ({
  speaker,
  category,
  electorate,
  party,
  content,
  house,
  chamber,
}: {
  speaker?: string;
  category: string;
  electorate: string;
  party: string;
  content: string;
  house: "hor" | "senate";
  chamber: "main" | "federation" | "unknown";
}) => {
  const snippet = content.substring(0, 120);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="hover:underline flex justify-between items-baseline font-medium text-lg">
          {speaker}{" "}({electorate || "Unknown Electorate"})
        </h2>
        <div className="flex flex-wrap gap-1">
          <Badge>{category}</Badge>
          <Badge>{party}</Badge>
          <Badge>{chamber}</Badge>
          <HouseBadge house={house} />
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm">
        <p>{`${snippet}${(content?.length || 0) > 120 ? "…" : ""}`}</p>
      </div>
    </div>
  );
};
