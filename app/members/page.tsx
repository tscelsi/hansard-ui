import { getDb } from "@/lib/mongodb";
import { Talker } from "@/types/index";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

export default async function MembersListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const match: any = {};
  if (partiesSel.length) match["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    match["talker_info.electorate"] = { $in: electoratesSel };
  const db = await getDb();
  const pipeline: any[] = [
    {
      $lookup: {
        from: "talkers",
        localField: "talker_id",
        foreignField: "id",
        as: "talker_info",
      },
    },
    { $unwind: "$talker_info" },
    { $match: match },
    {
      $group: {
        _id: "$talker_id",
        party: { $first: "$talker_info.party" },
        electorate: { $first: "$talker_info.electorate" },
        name: { $first: "$talker_info.name" },
      },
    },
    {
      $project: {
        id: "$_id",
        party: 1,
        electorate: 1,
        name: 1,
        _id: 0,
      },
    },
    { $sort: { name: 1 } },
  ];
  const members = (await db
    .collection("speeches")
    .aggregate(pipeline)
    .toArray()) as Talker[];

  if (members.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No members found for current filters.
      </p>
    );
  }
  return (
    <div>
      <div>
        <ol className="border-b py-2 px-2 flex items-center gap-1 text-gray-500">
          <li className="text-xs text-dark-text text-nowrap overflow-hidden text-ellipsis">
            <span className={clsx(instrumentSans.className)}>
              Members
            </span>
          </li>
        </ol>
      </div>
      {members.map((m) => {
        const href = `/members/${encodeURIComponent(m.id)}`;
        return (
          <a key={m.id} href={href}>
            <div className="hover:cursor-pointer flex flex-col gap-2 p-2 border-b">
              <div className="flex flex-col gap-1">
                <div className="hover:underline flex justify-between items-baseline text-3xl">
                  <strong>{m.name || "Unknown Member"}</strong>
                </div>
                <div className="font-medium">
                  <span>Party:</span> {m.party || "Unknown"} |{" "}
                  <span>Electorate:</span> {m.electorate || "Unknown"}
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
