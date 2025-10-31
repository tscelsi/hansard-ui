"use client";

import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { SpeechPartWithTalkerInfo } from "@/types/index";
import { SpeechListItem } from "components/SpeechListItem";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Route } from "next";

const columnHelper = createColumnHelper<SpeechPartWithTalkerInfo>();

const columns = [
  columnHelper.accessor("speech_id", {
    header: "Speech",
    cell: (info) => {
      const s = info.row.original;
      return (
        <Link href={("/speeches/" + encodeURIComponent(s.speech_id)) as Route}>
          <div className="p-2">
            <SpeechListItem
              speaker={s.talker_name || undefined}
              title={s.subdebate_1_title || "Speech"}
              category={s.debate_category}
              house={s.house}
              party={s.talker_party || "Unknown"}
              content={s.speech_content || ""}
              date={s.date}
              electorate={s.talker_electorate}
            />
          </div>
        </Link>
      );
    },
  }),
];

export const SpeechesTable = ({
  data,
  total,
  page,
  pageSize,
}: {
  data: SpeechPartWithTalkerInfo[];
  total: number;
  page: number; // 1-based
  pageSize: number;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const pageIndex = Math.max(0, page - 1);
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data, // already server-paginated
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount,
  });

  const updateQuery = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") params.delete(k);
        else params.set(k, String(v));
      });
      router.push(`${pathname}?${params.toString()}` as Route);
    },
    [pathname, router, searchParams]
  );

  const goPrev = () => {
    if (pageIndex <= 0) return;
    updateQuery({ page: pageIndex, pageSize }); // set to previous (1-based)
  };
  const goNext = () => {
    if (pageIndex + 1 >= pageCount) return;
    updateQuery({ page: pageIndex + 2, pageSize });
  };
  const setRowsPerPage = (size: number) => {
    updateQuery({ page: 1, pageSize: size });
  };

  return (
    <div className={clsx("text-sm flex flex-col gap-2")}>
      <table className="w-full">
        {/* <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b-2 border-dark-grey">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="text-left px-1 py-2">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead> */}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b-2 last:border-0 border-dark-grey">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="whitespace-nowrap px-1 py-2 overflow-hidden text-ellipsis"
                  style={{ maxWidth: 0 }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mb-2">
        <div>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50 mr-2"
            onClick={goPrev}
            disabled={pageIndex <= 0}
          >
            Previous
          </button>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={goNext}
            disabled={pageIndex + 1 >= pageCount}
          >
            Next
          </button>
        </div>
        <div>
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div>
          <label className="flex gap-2 items-center">
            Rows per page
            <select
              className="bg-dark-bg border rounded px-1 py-0.5"
              value={pageSize}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};
