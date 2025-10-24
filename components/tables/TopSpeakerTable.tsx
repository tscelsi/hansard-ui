"use client";

import { TopSpeakersResult } from "@/lib/queries";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { Route } from "next";
import React from "react";
import { ChevronDown12Filled } from "@fluentui/react-icons";

const columnHelper = createColumnHelper<TopSpeakersResult>();

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

export const TopSpeakerTable = ({ data }: { data: TopSpeakersResult[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className={clsx("text-sm", instrumentSans.className)}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b-2 border-gray-800">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={clsx("text-left px-1 py-2", header.column.getCanSort() && "hover:cursor-pointer select-none")}
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
              className="border-b-2 last:border-0 border-gray-800"
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
    </div>
  );
};
