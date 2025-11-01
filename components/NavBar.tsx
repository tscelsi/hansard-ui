"use client";
import Link from "next/link";
import React from "react";
import { DarkTheme20Filled, List24Filled } from "@fluentui/react-icons";
import clsx from "clsx";

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

export default function NavBar() {
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState<boolean>(false);

  // Initialize theme from localStorage or system preference
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const useDark = stored ? stored === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", useDark);
      setIsDark(useDark);
    } catch {
      // no-op
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };
  return (
    <>
      <div className="flex h-[48px] border-b border-dark-grey">
        <MenuItem
          className={clsx(
            menuOpen &&
              "dark:bg-light-bg dark:text-light-text bg-dark-bg text-dark-text",
            !menuOpen && "border-r border-dark-grey"
          )}
          onClick={() => {
            setMenuOpen((v) => !v);
            if (filterOpen) setFilterOpen(false);
          }}
        >
          <List24Filled />
        </MenuItem>
        <div className="flex flex-1 gap-2 items-center justify-end text-3xl p-2">
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={isDark}
            onClick={toggleTheme}
            className={clsx(
              "flex items-center rounded-full transition",
              "hover:bg-light-grey/60",
              isDark ? "text-dark-text" : "text-light-text"
            )}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <DarkTheme20Filled />
          </button>
          <Link href="/" className="font-medium hover:opacity-90 transition">
            Hansard.
          </Link>
        </div>
      </div>
      {menuOpen && (
        <ol className="z-10 absolute dark:bg-light-bg dark:text-light-text bg-dark-bg text-dark-text w-full h-fit text-2xl font-medium">
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href={"/members"}>Members</Link>
          </li>
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href="/speeches">Speeches</Link>
          </li>
          <li className="transition flex items-center h-[48px] p-2 border-b border-dark-grey hover:cursor-pointer hover:bg-dark-bg/10">
            <Link href="/bills">Bills</Link>
          </li>
        </ol>
      )}
    </>
  );
}
