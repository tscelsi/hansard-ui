"use client";
import Link from "next/link";
import React from "react";
import {
  Dismiss24Filled,
  List24Filled,
  Search24Filled,
} from "@fluentui/react-icons";
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
      className={clsx(className, "min-w-[48px] text-xl font-medium p-2")}
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
    (length === 2 &&
      (segments[1] === "speeches" || segments[1] === "members")) ||
    (length === 3 && segments[1] === "members")
  );
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();
  return (
    <>
      <div className="flex h-[48px] border-b border-dark-grey">
        {/* <Link href="/members"><MenuItem className="border-r">Members</MenuItem></Link>
        <Link href="/speeches">
          <MenuItem className="border-r">Speeches</MenuItem>
        </Link> */}
        <MenuItem
          className={clsx(
            menuOpen && "bg-light-bg text-light-text",
            !menuOpen && "bg-dark-bg border-r border-dark-grey"
          )}
          onClick={() => {
            setMenuOpen((v) => !v);
            if (filterOpen) setFilterOpen(false);
          }}
        >
          <List24Filled />
        </MenuItem>
        {pageNeedsFilter(pathname) && (
          <MenuItem
            className={clsx(
              filterOpen && "bg-light-bg text-light-text",
              !filterOpen && "bg-dark-bg border-r border-dark-grey"
            )}
            onClick={() => {
              setFilterOpen((v) => !v);
              if (menuOpen) setMenuOpen(false);
            }}
          >
            {!filterOpen ? (
              <Search24Filled
                className={clsx(filterOpen && "font-light-text")}
              />
            ) : (
              <Dismiss24Filled />
            )}
          </MenuItem>
        )}
        <div className="flex flex-1 justify-end text-3xl p-2">
          <Link href="/" className="font-medium hover:opacity-90 transition">Hansard.</Link>
        </div>
      </div>
      {filterOpen && (
        <div className="absolute bg-light-bg text-light-text w-full h-full">
          <SpeechFilters
            categoryOptions={filters.categories}
            partyOptions={filters.parties}
            electorateOptions={filters.electorates}
          />
        </div>
      )}
      {menuOpen && (
        <ol className="z-10 absolute bg-light-bg text-light-text w-full h-full">
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey text-2xl font-semibold hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href={"/members"}>Members</Link>
          </li>
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey text-2xl font-semibold hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href="/speeches">Speeches</Link>
          </li>
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey text-2xl font-semibold hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href="/bills">Bills</Link>
          </li>
        </ol>
      )}
    </>
  );
}
