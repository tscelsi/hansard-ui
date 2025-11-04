import { getDb } from "@/lib/mongodb";
import { SpeechPartWithTalkerInfo } from "@/types/index";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import MultiSelect from "components/MultiSelect";
import { SpeechesTable } from "components/tables/SpeechesTable";
import Link from "next/link";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

async function fetchFilters() {
  const db = await getDb();
  // Options for filters
  const [categories, parties, electorates] = await Promise.all([
    db.collection("parts").distinct("debate_category", {
      debate_category: { $ne: null },
    }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("party", { party: { $ne: null } }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("electorate", { electorate: { $ne: null } }) as Promise<
      string[]
    >,
  ]);
  return { categories, parties, electorates };
}

export default async function SpeechesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const {
    parties: partyOptions,
    categories: categoryOptions,
    electorates: electorateOptions,
  } = await fetchFilters();
  const pageParam = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  const sizeParam = Array.isArray(searchParams.pageSize)
    ? searchParams.pageSize[0]
    : searchParams.pageSize;
  const page = Math.max(1, Number(pageParam || "1"));
  const pageSize = Math.max(1, Number(sizeParam || "10"));
  const categoriesSel = toArr(searchParams.debate_category);
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const house = toArr(searchParams.house);
  const query = toStr(searchParams.query);
  const match: any = {};
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
  if (partiesSel.length) match["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    match["talker_info.electorate"] = { $in: electoratesSel };
  if (house.length) match.house = { $in: house };
  const range: any = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  if (Object.keys(range).length) match.date = range;
  const db = await getDb();
  let pipeline: any[] = [
    {
      $match: {
        type: "speech",
        speech_seq: 0,
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
    { $unwind: "$talker_info" },
    { $match: match },
    {
      $addFields: {
        talker_name: "$talker_info.name",
        talker_party: "$talker_info.party",
        talker_electorate: "$talker_info.electorate",
      },
    },
    {
      $project: {
        _id: 0,
        talker_info: 0,
      },
    },
    {
      $sort: {
        date: -1,
        debate_seq: 1,
        subdebate_1_seq: 1,
        subdebate_2_seq: 1,
        speech_seq: 1,
      },
    },
  ];

  if (query && query !== "") {
    // place at the front of the pipeline
    pipeline.splice(0, 0, {
      $search: {
        index: "search_index",
        text: {
          query: query,
          path: "speech_content",
          matchCriteria: "all",
        },
      },
    });
  }

  const dataPipeline = [
    ...pipeline,
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ];

  const [summaries, totalAgg] = await Promise.all([
    db
      .collection("parts")
      .aggregate<SpeechPartWithTalkerInfo>(dataPipeline)
      .toArray(),
    db
      .collection("parts")
      .aggregate([
        ...pipeline.filter(
          (stage) => !("$sort" in stage) && !("$project" in stage)
        ),
        { $count: "total" },
      ])
      .toArray(),
  ]);
  const total = totalAgg[0]?.total ?? 0;

  return (
    <div>
      <div>
        <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500">
          <li className="text-xs text-light-text dark:text-dark-text text-nowrap overflow-hidden text-ellipsis">
            <span className={clsx(instrumentSans.className)}>Speeches</span>
          </li>
        </ol>
      </div>
      <div className="border-b border-dark-grey px-2 py-4 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Speeches</h1>
        <h2 className={clsx(instrumentSans.className, "text-sm")}>
          Search through speeches in parliament. Use the filters to narrow down
          results.
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
              placeholder="Search..."
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
            label="Category"
            name="debate_category"
            options={categoryOptions.map((c) => ({
              label: c,
              value: c,
            }))}
            defaultValues={toArr(searchParams.debate_category)}
            placeholder="All"
            className="flex-1"
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
          <div className="flex flex-col gap-2 p-2 border-b border-r border-dark-grey min-h-[64px] flex-1">
            <label htmlFor="from" className="block text-xs font-bold">
              Earliest
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className={clsx(
                instrumentSans.className,
                "bg-light-bg dark:bg-dark-bg text-sm"
              )}
            />
          </div>
          <div className="flex flex-col gap-2 p-2 border-b border-r border-dark-grey min-h-[64px] flex-1">
            <label htmlFor="to" className="block text-xs font-bold">
              Latest
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className={clsx(
                instrumentSans.className,
                "bg-light-bg dark:bg-dark-bg text-sm"
              )}
            />
          </div>
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
              href="/speeches"
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
      <div className="border-b border-dark-grey">
      {summaries.length > 0 ? (
        <SpeechesTable
          data={summaries}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          No speeches found for current filters.
        </p>
      )}
      </div>
    </div>
  );
}
