"use client";

import React from "react";
import MultiSelect from "./MultiSelect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Route } from "next";

const toArr = (v: string | string[] | undefined | null) =>
  Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];

const toStr = (v: string | string[] | undefined | null) =>
  Array.isArray(v) ? v[0] ?? "" : v ?? "";

const getFiltersForPage = (pathname: string) => {
  const segments = pathname.split("/");
  if (segments[1] === "speeches") {
  }
};

export default function SpeechFilters({
  categoryOptions,
  partyOptions,
  electorateOptions,
}: {
  categoryOptions: string[];
  partyOptions: string[];
  electorateOptions: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const { replace } = useRouter();

  function handleChange(
    type: "debate_category" | "party" | "electorate" | "from" | "to",
    v: string[]
  ) {
    const params = new URLSearchParams(searchParams);
    params.delete(type);
    for (const cat of v) {
      params.append(type, cat);
    }
    const path = `${pathname}?${params.toString()}`
    replace(path as Route);
  }

  const from = toStr(searchParams.get("from"));
  const to = toStr(searchParams.get("to"));
  let filters;
  if (pathSegments[1] === "speeches") {
    filters = (
      <>
        <MultiSelect
          label="Party"
          name="party"
          options={partyOptions.map((p) => ({ value: p, label: p }))}
          defaultValues={toArr(searchParams.getAll("party"))}
          placeholder="Choose parties"
          onChange={(v) => handleChange("party", v)}
        />
        <MultiSelect
          label="Category"
          name="debate_category"
          options={categoryOptions.map((c) => ({ label: c, value: c }))}
          defaultValues={toArr(searchParams.getAll("debate_category"))}
          placeholder="Choose categories"
          onChange={(v) => handleChange("debate_category", v)}
        />
        <MultiSelect
          name="electorate"
          label="Electorate"
          options={electorateOptions.map((e) => ({ value: e, label: e }))}
          onChange={(v) => handleChange("electorate", v)}
          defaultValues={toArr(searchParams.getAll("electorate"))}
          placeholder="Choose electorates"
        />
        <div className="flex flex-col gap-1 p-2 border-b border-light-text min-h-[64px]">
          <label htmlFor="from" className="block text-xs font-bold">
            Earliest
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            onChange={(e) => handleChange("from", [e.target.value])}
            className="bg-light-bg"
          />
        </div>

        <div className="flex flex-col gap-1 p-2 border-b border-light-text min-h-[64px]">
          <label htmlFor="to" className="block text-xs font-bold">
            Latest
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            onChange={(e) => handleChange("to", [e.target.value])}
            className="bg-light-bg"
          />
        </div>
      </>
    );
  } else if (pathSegments[1] === "members" && pathSegments.length === 2) {
    filters = (
      <>
        <MultiSelect
          label="Party"
          name="party"
          options={partyOptions.map((p) => ({ value: p, label: p }))}
          defaultValues={toArr(searchParams.getAll("party"))}
          placeholder="Choose parties"
          onChange={(v) => handleChange("party", v)}
        />
        <MultiSelect
          name="electorate"
          label="Electorate"
          options={electorateOptions.map((e) => ({ value: e, label: e }))}
          onChange={(v) => handleChange("electorate", v)}
          defaultValues={toArr(searchParams.getAll("electorate"))}
          placeholder="Choose electorates"
        />
      </>
    );
  } else if (pathSegments[1] === "members" && pathSegments.length === 3) {
    // No filters for individual member page
    filters = (
      <>
        <MultiSelect
          label="Category"
          name="debate_category"
          options={categoryOptions.map((c) => ({ label: c, value: c }))}
          defaultValues={toArr(searchParams.getAll("debate_category"))}
          placeholder="Choose categories"
          onChange={(v) => handleChange("debate_category", v)}
        />
        <div className="flex flex-col gap-1 p-2 border-b border-light-text min-h-[64px]">
          <label htmlFor="from" className="block text-xs font-bold">
            Earliest
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            onChange={(e) => handleChange("from", [e.target.value])}
            className="bg-light-bg"
          />
        </div>

        <div className="flex flex-col gap-1 p-2 border-b border-light-text min-h-[64px]">
          <label htmlFor="to" className="block text-xs font-bold">
            Latest
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            onChange={(e) => handleChange("to", [e.target.value])}
            className="bg-light-bg"
          />
        </div>
      </>
    );
  }

  return <div>{filters}</div>;
}
