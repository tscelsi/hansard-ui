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


type TalkerWithHouse = Talker & { house: "hor" | "senate" };

export default async function MembersListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageParam = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  const sizeParam = Array.isArray(searchParams.pageSize)
    ? searchParams.pageSize[0]
    : searchParams.pageSize;
  const page = Math.max(1, Number(pageParam || "1"));
  const pageSize = Math.max(1, Number(sizeParam || "20"));
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const houseSel = toArr(searchParams.house);
  const query = toStr(searchParams.query);
  // Build base match on talkers collection to avoid scanning all parts.
  const talkerMatch: any = {};
  if (partiesSel.length) talkerMatch.party = { $in: partiesSel };
  if (electoratesSel.length) talkerMatch.electorate = { $in: electoratesSel };
  if (query) talkerMatch.name = { $regex: query, $options: "i" };
  const db = await getDb();
  // Switch to talkers-first pipeline: we only touch parts to verify membership
  // and derive house, using $limit:1 to avoid scanning all speeches per person.
  const pipeline: any[] = [
    { $match: talkerMatch },
    {
      $lookup: {
        from: "parts",
        let: { tid: "$id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$talker_id", "$$tid"] },
                  { $eq: ["$type", "speech"] },
                  { $eq: ["$part_seq", 0] },
                  ...(houseSel.length ? [{ $in: ["$house", houseSel] }] : []),
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "parts_hit",
      },
    },
    { $match: { parts_hit: { $ne: [] } } },
    { $addFields: { house: { $first: "$parts_hit.house" } } },
    {
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        party: 1,
        electorate: 1,
        house: 1,
      },
    },
    { $sort: { name: 1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ];
  // Options for filters
  const [partyOptions, electorateOptions, members, totalAgg] = await Promise.all([
    db
      .collection("talkers")
      .distinct("party", { party: { $ne: null } }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("electorate", { electorate: { $ne: null } }) as Promise<
      string[]
    >,
    db.collection("talkers").aggregate<TalkerWithHouse>(pipeline).toArray(),
    // total count for pagination
    db
      .collection("talkers")
      .aggregate([
        { $match: talkerMatch },
        {
          $lookup: {
            from: "parts",
            let: { tid: "$id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$talker_id", "$$tid"] },
                      { $eq: ["$type", "speech"] },
                      { $eq: ["$part_seq", 0] },
                      ...(houseSel.length ? [{ $in: ["$house", houseSel] }] : []),
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "parts_hit",
          },
        },
        { $match: { parts_hit: { $ne: [] } } },
        { $count: "total" },
      ])
      .toArray(),
  ]);
  const total = totalAgg[0]?.total ?? 0;


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
      {members.length ? (
        members.map((m) => {
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
      {/* Pagination controls */}
      <div className="flex items-center justify-between p-2 border-b border-dark-grey">
        <div className={clsx(instrumentSans.className, "text-sm")}> 
          Showing {(page - 1) * pageSize + 1}
          {"-"}
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <div className="flex gap-2">
          <PaginationLink
            label="Previous"
            page={page - 1}
            disabled={page <= 1}
            pageSize={pageSize}
            searchParams={searchParams}
          />
          <PaginationLink
            label="Next"
            page={page + 1}
            disabled={page * pageSize >= total}
            pageSize={pageSize}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}

function PaginationLink({
  label,
  page,
  pageSize,
  searchParams,
  disabled,
}: {
  label: string;
  page: number;
  pageSize: number;
  searchParams: { [key: string]: string | string[] | undefined };
  disabled?: boolean;
}) {
  const params = new URLSearchParams();
  // preserve filters
  const copy = (key: string) => {
    const v = searchParams[key];
    if (Array.isArray(v)) v.forEach((x) => x && params.append(key, x));
    else if (v) params.set(key, v);
  };
  ["party", "electorate", "house", "query"].forEach(copy);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return (
    <Link
      aria-disabled={disabled}
      href={disabled ? "#" : { pathname: "/members", query: Object.fromEntries(params as any) }}
      className={clsx(
        instrumentSans.className,
        "px-3 py-1 rounded border text-sm",
        disabled
          ? "opacity-50 cursor-not-allowed border-dark-grey text-gray-500"
          : "border-light-grey hover:bg-dark-bg hover:text-dark-text dark:hover:bg-light-bg dark:hover:text-light-text"
      )}
    >
      {label}
    </Link>
  );
}
