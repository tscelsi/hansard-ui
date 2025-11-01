import { getDb } from "@/lib/mongodb";
import { Talker } from "@/types/index";
import { Location12Regular } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import Badge, { HouseBadge, IconBadge } from "components/Badge";
import MultiSelect from "components/MultiSelect";
import Link from "next/link";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

async function fetchFilters() {
  const db = await getDb();
  // Options for filters
  const [parties, electorates] = await Promise.all([
    db
      .collection("talkers")
      .distinct("party", { party: { $ne: null } }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("electorate", { electorate: { $ne: null } }) as Promise<
      string[]
    >,
  ]);
  return { parties, electorates };
}

type TalkerWithHouse = Talker & { house: "hor" | "senate" };

export default async function MembersListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { parties: partyOptions, electorates: electorateOptions } =
    await fetchFilters();
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const houseSel = toArr(searchParams.house);
  const query = toStr(searchParams.query);
  const match: any = {};
  if (partiesSel.length) match["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    match["talker_info.electorate"] = { $in: electoratesSel };
  if (houseSel.length) match["house"] = { $in: houseSel };
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
        house: { $first: "$house" },
      },
    },
    {
      $project: {
        id: "$_id",
        party: 1,
        electorate: 1,
        name: 1,
        house: 1,
        _id: 0,
      },
    },
    { $sort: { name: 1 } },
  ];

  const members = await db
    .collection("parts")
    .aggregate<TalkerWithHouse>(pipeline)
    .toArray();

  // filter member names by query
  const filteredMembers = query
    ? members.filter((m) =>
        m.name?.toLowerCase().includes(query.toLowerCase())
      )
    : members;

  return (
    <div>
      <div>
        <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 dark:text-dark-text text-light-text">
          <li className="text-xs text-nowrap overflow-hidden text-ellipsis">
            <span className={clsx(instrumentSans.className)}>Members</span>
          </li>
        </ol>
      </div>
      <div className="border-b border-dark-grey px-2 py-4 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Members</h1>
        <h2 className={clsx(instrumentSans.className, "text-sm")}>
          Search for members who give speeches in parliament. Use the filters to
          narrow down results.
        </h2>
      </div>
      <div className="flex">
        <form method="get" className="flex flex-1 flex-wrap items-stretch">
          <div className="flex flex-col gap-2 border-b border-r border-dark-grey min-h-[64px] flex-1 sm:flex-2">
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={query}
              className={clsx(
                instrumentSans.className,
                "font-medium bg-light-bg dark:bg-dark-bg text-sm h-full focus:outline-none px-2 text-xl overflow-scroll"
              )}
              placeholder="Search by name..."
              maxLength={60}
            />
          </div>
          <MultiSelect
            label="Party"
            name="party"
            options={partyOptions.map((p) => ({ value: p, label: p }))}
            defaultValues={toArr(searchParams.party)}
            className="flex-1"
            placeholder="All"
          />
          <MultiSelect
            name="electorate"
            label="Electorate"
            options={electorateOptions.map((e) => ({
              value: e,
              label: e,
            }))}
            defaultValues={toArr(searchParams.electorate)}
            placeholder="All"
            className="flex-1"
          />
          <MultiSelect
            name="house"
            label="House"
            options={[
              { value: "hor", label: "House" },
              { value: "senate", label: "Senate" },
            ]}
            defaultValues={toArr(searchParams.house)}
            placeholder="All"
            className="flex-1"
          />
          <div className="border-b border-dark-grey h-[64px] flex-1 flex items-center p-2 gap-2 border-r">
            <button
              type="submit"
              className={clsx(
                instrumentSans.className,
                "p-2 bg-dark-bg text-dark-text dark:bg-light-bg dark:text-light-text rounded border border-light-grey text-sm"
              )}
            >
              Apply
            </button>
            <Link
              href="/members"
              className={clsx(
                instrumentSans.className,
                "p-2 text-light-text dark:text-dark-text text-center rounded border border-dark-grey text-sm"
              )}
            >
              Clear
            </Link>
          </div>
        </form>
      </div>
      {filteredMembers.length ? (
        filteredMembers.map((m) => {
          return (
            <Link
              key={m.id}
              href={`/members/${encodeURIComponent(m.id)}`}
              className="hover:cursor-pointer flex flex-col gap-2 p-2 border-b border-dark-grey"
            >
              <div className="flex flex-col gap-1">
                <div className="hover:underline flex justify-between items-baseline text-3xl">
                  <strong>{m.name || "Unknown Member"}</strong>
                </div>
                <div className="flex gap-1 font-medium">
                  <Badge>{m.party || "Unknown"}</Badge>
                  <IconBadge icon={<Location12Regular />}>
                    {m.electorate || "Unknown"}
                  </IconBadge>
                  <HouseBadge house={m.house} />
                </div>
              </div>
            </Link>
          );
        })
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          No members found for current filters.
        </p>
      )}
    </div>
  );
}
