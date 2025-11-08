"use client";

import { SpeakersResult } from "@/lib/bill_query_types";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { Route } from "next";
import React from "react";
import { ChevronDown12Filled } from "@fluentui/react-icons";
import { HouseBadge } from "components/Badge";

const columnHelper = createColumnHelper<SpeakersResult>();

const columns = [
  columnHelper.accessor("name", {
    header: "Speaker",
    cell: (info) => (
      <LinkCell
        value={info.getValue()}
        href={`/members/${info.row.original.id}`}
      />
    ),
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("party", {
    header: "Party",
    cell: (info) => info.getValue(),
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("house", {
    header: "House",
    cell: (info) => <HouseBadge house={info.getValue()} />,
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("count", {
    header: "# Speeches",
    cell: (info) => info.getValue(),
    sortingFn: "alphanumeric",
  }),
];

const LinkCell = ({
  value,
  href,
}: {
  value: string | number;
  href: string;
}) => {
  return (
    <Link href={href as Route} className="hover:underline font-semibold">
      {value}
    </Link>
  );
};

export const SpeakerTable = ({ data }: { data: SpeakersResult[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  return (
    <div
      className={clsx("text-sm flex flex-col gap-2", instrumentSans.className)}
    >
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-dark-grey">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={clsx(
                    "text-left px-1 py-2",
                    header.column.getCanSort() &&
                      "hover:cursor-pointer select-none"
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b last:border-0 border-dark-grey"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={clsx("whitespace-nowrap px-1 py-2 overflow-hidden text-ellipsis")}
                  style={{ maxWidth: 0 }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="flex items-center justify-between mb-2">
        <div>
          <button
            className="px-2 py-1 border border-dark-grey rounded disabled:opacity-50 mr-2"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="px-2 py-1 border border-dark-grey rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
        <div>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount().toLocaleString()}
        </div>
        <div>
          <label className="flex gap-2 items-center">
            Rows per page
            <select
              className="bg-light-bg dark:bg-dark-bg border border-dark-grey rounded px-1 py-0.5"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
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
