"use client";
import Link from "next/link";
import React from "react";
import { Dismiss24Filled, Filter24Filled } from "@fluentui/react-icons";
import clsx from "clsx";
import SpeechFilters from "./SpeechFilters";
import { usePathname } from "next/navigation";

type MenuItemProps = {
  children?: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const MenuItem = ({ children, className, ...rest }: MenuItemProps) => {
  return (
    <button
      className={clsx("min-w-[48px] text-xl font-medium p-2", className)}
      {...rest}
    >
      {children}
    </button>
  );
};

const pageNeedsFilter = (pathname: string) => {
  const segments = pathname.split("/");
  const length = segments.length;
  return (
    length === 2 && (segments[1] === "speeches" || segments[1] === "members")
  ) || length === 3 && (segments[1] === "members");
};

export default function NavBar({
  filtersPromise,
}: {
  filtersPromise: Promise<{
    categories: string[];
    parties: string[];
    electorates: string[];
  }>;
}) {
  const filters = React.use(filtersPromise);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const pathname = usePathname();
  return (
    <>
      <div className="flex h-[48px] border-b">
        <Link href="/members"><MenuItem className="border-r">Members</MenuItem></Link>
        <Link href="/speeches">
          <MenuItem className="border-r">Speeches</MenuItem>
        </Link>
        <MenuItem className="border-r flex-1"></MenuItem>
        {pageNeedsFilter(pathname) && (
          <MenuItem
            className={clsx(
              filterOpen && "bg-light-bg text-light-text",
              !filterOpen && "bg-dark-bg"
            )}
            onClick={() => setFilterOpen((v) => !v)}
          >
            {!filterOpen ? (
              <Filter24Filled
                className={clsx(filterOpen && "font-light-text")}
              />
            ) : (
              <Dismiss24Filled />
            )}
          </MenuItem>
        )}
      </div>
      {filterOpen && (
        <div className="absolute z-1 bg-light-bg text-light-text w-full h-full">
          <SpeechFilters
            categoryOptions={filters.categories}
            partyOptions={filters.parties}
            electorateOptions={filters.electorates}
          />
        </div>
      )}
    </>
  );
}
