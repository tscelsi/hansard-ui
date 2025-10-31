import { getDb } from "@/lib/mongodb";
import { SpeechPartWithTalkerInfo, Talker } from "@/types/index";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import MultiSelect from "components/MultiSelect";
import { SpeechListItem } from "components/SpeechListItem";
import { SpeechesTable } from "components/tables/SpeechesTable";
import { Route } from "next";
import Link from "next/link";

type SpeechListItemType = {
  speech_id: string;
  date: string;
  debate_category: string;
  subdebate_1_title: string;
  bill_ids: string[] | null;
  house: "hor" | "senate";
  speech_part_type: "interjection" | "continuation" | "speech";
  first_content: string;
  main_talker_id: string;
  talker_ids: string[];
};

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
  const query = toStr(searchParams.query);
  const match: any = {};
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
  if (partiesSel.length) match["talker_info.party"] = { $in: partiesSel };
  if (electoratesSel.length)
    match["talker_info.electorate"] = { $in: electoratesSel };
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

  if (summaries.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No speeches found for current filters.
      </p>
    );
  }

  return (
    <div>
      <div>
        <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500">
          <li className="text-xs text-dark-text text-nowrap overflow-hidden text-ellipsis">
            <span className={clsx(instrumentSans.className)}>Speeches</span>
          </li>
        </ol>
      </div>
      <div className="flex">
        <form method="get" className="flex flex-1 flex-wrap items-center">
          <div className="flex flex-col gap-2 border-b border-r border-dark-grey h-[64px] flex-1">
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={query}
              className={clsx(
                instrumentSans.className,
                "font-medium bg-dark-bg text-sm h-full focus:outline-none px-2 text-xl overflow-scroll"
              )}
              placeholder="Search..."
            />
          </div>
          <MultiSelect
            label="Party"
            name="party"
            options={partyOptions.map((p) => ({ value: p, label: p }))}
            defaultValues={toArr(searchParams.party)}
            placeholder="All"
          />
          <MultiSelect
            label="Category"
            name="debate_category"
            options={categoryOptions.map((c) => ({ label: c, value: c }))}
            defaultValues={toArr(searchParams.debate_category)}
            placeholder="All"
          />
          <MultiSelect
            name="electorate"
            label="Electorate"
            options={electorateOptions.map((e) => ({ value: e, label: e }))}
            defaultValues={toArr(searchParams.electorate)}
            placeholder="All"
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
          />
          <div className="flex flex-col gap-2 p-2 border-b border-r border-dark-grey min-h-[64px]">
            <label htmlFor="from" className="block text-xs font-bold">
              Earliest
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className={clsx(instrumentSans.className, "bg-dark-bg text-sm")}
            />
          </div>
          <div className="flex flex-col gap-2 p-2 border-b border-r border-dark-grey min-h-[64px]">
            <label htmlFor="to" className="block text-xs font-bold">
              Latest
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className={clsx(instrumentSans.className, "bg-dark-bg text-sm")}
            />
          </div>
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Apply Filters
          </button>
          <Link href="/speeches">
            <button className="ml-2 px-4 py-2 bg-gray-600 text-white rounded">
              Clear Filters
            </button>
          </Link>
        </form>
      </div>
      <SpeechesTable
        data={summaries}
        total={total}
        page={page}
        pageSize={pageSize}
      />
      {/* {summaries.map((s) => {
        const href = `/speeches/${encodeURIComponent(s.speech_id)}`;
        return (
          <Link key={s.speech_id} href={href as Route}>
            <div className="flex flex-col border-b border-dark-grey p-2">
              <SpeechListItem
                speaker={s.talker_name || undefined}
                title={s.subdebate_1_title || "Speech"}
                category={s.debate_category}
                house={s.house}
                party={s.talker_party || "Unknown"}
                content={s.speech_content || ""}
                date={s.date}
              />
            </div>
          </Link>
        );
      })} */}
    </div>
  );
}
