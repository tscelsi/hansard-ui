import { getDb } from "@/lib/mongodb";
import type { SpeechPart, Talker } from "@/types/index";
import { ChevronRight12Filled } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import MultiSelect from "components/MultiSelect";
import { SpeechListItem } from "components/SpeechListItem";
import { Route } from "next";
import Link from "next/link";

const toArr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

const toStr = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

async function fetchFilters(talker_id: string) {
  const db = await getDb();
  // Options for filters
  const categories = await db
    .collection("parts")
    .aggregate<{ debate_category: string }>([
      { $match: { talker_id: talker_id } },
      { $group: { _id: "$debate_category" } },
      { $project: { _id: 0, debate_category: "$_id" } },
    ])
    .toArray()
    .then((res) => res.map((r) => r.debate_category).filter(Boolean));
  return { categories };
}

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id } = params;
  const db = await getDb();
  const { categories: categoryOptions } = await fetchFilters(id);
  const categoriesSel = toArr(searchParams.debate_category);
  const from = toStr(searchParams.from);
  const to = toStr(searchParams.to);
  const query = toStr(searchParams.query);
  const match: any = { talker_id: id };
  if (categoriesSel.length) match.debate_category = { $in: categoriesSel };
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
  const pipeline: any[] = [
    {
      $match: match,
    },
    {
      $sort: {
        date: -1,
        speech_seq: 1,
      },
    },
    {
      $group: {
        _id: "$speech_id",
        firstPart: {
          $first: "$$ROOT",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$firstPart",
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

  const [parts, talker] = await Promise.all([
    db.collection("parts").aggregate<SpeechPart>(pipeline).toArray(),
    db.collection("talkers").findOne<Talker>({ id: id }),
  ]);

  if (!talker) {
    return (
      <div className="container">
        <div className="card">
          <p className="muted">Member with ID {id} not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div>
        <ol className="border-b border-dark-grey py-2 px-2 flex items-center gap-1 text-gray-500">
          <li>
            <Link
              href="/members"
              className={clsx(
                instrumentSans.className,
                "flex text-xs hover:text-light-text/80 dark:hover:text-dark-text/80 transition"
              )}
            >
              Members
            </Link>
          </li>
          <li className="flex">
            <ChevronRight12Filled />
          </li>
          <li className="text-xs text-light-text dark:text-dark-text text-nowrap overflow-hidden text-ellipsis align-baseline">
            <span className={clsx(instrumentSans.className)}>
              {talker.name}
            </span>
          </li>
        </ol>
      </div>
      <div className="card py-3 px-2 border-b border-dark-grey">
        <h1 className="text-4xl font-semibold">{talker.name}</h1>
        <h2>
          <span className="font-medium">Party:</span>{" "}
          {talker.party || "Unknown"} |{" "}
          <span className="font-medium">Electorate:</span>{" "}
          {talker.electorate || "Unknown"}
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
                "dark:bg-dark-bg bg-light-bg text-sm"
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
                "dark:bg-dark-bg bg-light-bg text-sm"
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
              href={`/members/${encodeURIComponent(id)}`}
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
      {parts.length > 0 ? (
        parts.map((p) => {
          const href = `/speeches/${encodeURIComponent(p.speech_id)}`;
          return (
            <Link href={href as Route} key={p.speech_id}>
              <div className="flex flex-col border-b border-dark-grey p-2">
                <SpeechListItem
                  title={p.subdebate_1_title || "Speech"}
                  category={p.debate_category}
                  party={talker.party}
                  house={p.house}
                  content={p.speech_content || ""}
                  type={p.speech_part_type}
                  date={p.date}
                />
              </div>
            </Link>
          );
        })
      ) : (
        <div className="container">
          <div className="card">
            <p className="muted">Search returned no results.</p>
          </div>
        </div>
      )}
    </div>
  );
}
