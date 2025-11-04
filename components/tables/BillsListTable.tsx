"use client";

import { SpeakersResult } from "@/lib/queries";
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
import React from "react";
import { BillsListResult } from "@/lib/bills_queries";
import { formatDate } from "@/lib/date";
import { HouseBadge } from "components/Badge";

const columnHelper = createColumnHelper<BillsListResult>();

const columns = [
  columnHelper.accessor("id", {
    cell: ({ row }) => {
      const bill = row.original;
      return (
        <Link
          href={`/bills/details/${encodeURIComponent(bill.id)}`}
          className="hover:underline"
        >
          <div className="flex flex-col gap-1 w-full">
            <h2 className="hover:underline flex justify-between items-baseline font-medium text-lg text-wrap">
              {bill.bill_title}
            </h2>
            <span className={clsx("mt-1 text-md flex gap-1 items-end", instrumentSans.className)}>
              {bill.num_speeches} speech{bill.num_speeches > 1 ? "es" : ""}.
              Latest speech was in the <HouseBadge house={bill.latest_house} />
            </span>
            <span
              className={clsx(
                "font-semibold text-xs mt-1",
                instrumentSans.className
              )}
            >
              {formatDate(bill.latest_date)}
            </span>
          </div>
        </Link>
      );
    },
    sortingFn: "alphanumeric",
  }),
];

export const BillsListTable = ({ data }: { data: BillsListResult[] }) => {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  return (
    <div className={clsx("text-sm flex flex-col gap-2")}>
      <table className="w-full">
        {/* <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b-2 border-gray-800">
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
        </thead> */}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b-2 last:border-0 border-dark-grey"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="w-1/3 whitespace-nowrap px-1 py-2 overflow-hidden text-ellipsis"
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
      <div
        className={clsx(
          instrumentSans.className,
          "flex items-center justify-between mb-2"
        )}
      >
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
