import { getDb } from "@/lib/mongodb";
import { toArr, toStr } from "@/lib/params";
import { SpeechPartWithTalkerInfo } from "@/types/index";
import { instrumentSans } from "app/fonts";
import { fetchFilters } from "app/lib/data";
import clsx from "clsx";
import MultiSelect from "components/MultiSelect";
import { SpeechesTable } from "components/tables/SpeechesTable";
import Link from "next/link";

export default async function SpeechesPage({
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
  const pageSize = Math.max(1, Number(sizeParam || "10"));
  const categoriesSel = toArr(searchParams.debate_category);
  const partiesSel = toArr(searchParams.party);
  const electoratesSel = toArr(searchParams.electorate);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const house = toArr(searchParams.house);
  const query = toStr(searchParams.query);
  const match: any = {};
  // We'll split the filters into those needing talker lookup (party/electorate)
  // and those that don't (category, house, date range, query). This lets us
  // paginate early (before expensive $lookup) when we don't need talker-based
  // filtering.
  const needTalkerFilter = partiesSel.length > 0 || electoratesSel.length > 0;
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
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

  // Build base match (fields existing on parts collection).
  const baseMatch: any = {
    type: "speech",
    part_seq: 0,
  };
  if (match.debate_category) baseMatch.debate_category = match.debate_category;
  if (match.house) baseMatch.house = match.house;
  if (range && Object.keys(range).length) baseMatch.date = range;

  // Talker-based match is separated so we can optionally defer lookup.
  const talkerMatch: any = {};
  if (partiesSel.length) talkerMatch["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    talkerMatch["talker_info.electorate"] = { $in: electoratesSel };

  const searchStage =
    query && query !== ""
      ? {
          $search: {
            index: "search_index",
            text: {
              query: query,
              path: "speech_content",
              matchCriteria: "all",
            },
          },
        }
      : null;

  const sortStage = {
    $sort: {
      date: -1,
      debate_seq: 1,
      subdebate_1_seq: 1,
      subdebate_2_seq: 1,
      speech_seq: 1,
      part_seq: 1,
    },
  };

  const addTalkerFieldsStage = {
    $addFields: {
      talker_name: "$talker_info.name",
      talker_party: "$talker_info.party",
      talker_electorate: "$talker_info.electorate",
    },
  };

  const projectStage = {
    $project: {
      _id: 0,
      talker_info: 0,
    },
  };

  // Pipeline variants:
  // 1. If we need talker filter: lookup early so we can filter, then sort and paginate.
  // 2. Otherwise: sort & paginate FIRST, then lookup just for enrichment (reduces lookup volume).
  let dataPipeline: any[];
  let countPipeline: any[];

  if (needTalkerFilter) {
    dataPipeline = [
      ...(searchStage ? [searchStage] : []),
      { $match: baseMatch },
      {
        $lookup: {
          from: "talkers",
          localField: "talker_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      { $unwind: "$talker_info" },
      ...(Object.keys(talkerMatch).length ? [{ $match: talkerMatch }] : []),
      sortStage,
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      addTalkerFieldsStage,
      projectStage,
    ];
    countPipeline = [
      ...(searchStage ? [searchStage] : []),
      { $match: baseMatch },
      {
        $lookup: {
          from: "talkers",
          localField: "talker_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      { $unwind: "$talker_info" },
      ...(Object.keys(talkerMatch).length ? [{ $match: talkerMatch }] : []),
      { $count: "total" },
    ];
  } else {
    dataPipeline = [
      ...(searchStage ? [searchStage] : []),
      { $match: baseMatch },
      sortStage,
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      // Enrich AFTER pagination
      {
        $lookup: {
          from: "talkers",
          localField: "talker_id",
          foreignField: "id",
          as: "talker_info",
        },
      },
      { $unwind: "$talker_info" },
      addTalkerFieldsStage,
      projectStage,
    ];
    countPipeline = [
      ...(searchStage ? [searchStage] : []),
      { $match: baseMatch },
      { $count: "total" },
    ];
  }

  const [
    {
      parties: partyOptions,
      categories: categoryOptions,
      electorates: electorateOptions,
    },
    speeches,
    totalAgg,
  ] = await Promise.all([
    fetchFilters(),
    db
      .collection("parts")
      .aggregate<SpeechPartWithTalkerInfo>(dataPipeline)
      .toArray(),
    db.collection("parts").aggregate(countPipeline).toArray(),
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
        {speeches.length > 0 ? (
          <SpeechesTable
            data={speeches}
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
