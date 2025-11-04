"use client";
import Link from "next/link";
import React from "react";
import { DarkTheme20Filled, List24Filled } from "@fluentui/react-icons";
import clsx from "clsx";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

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
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "dark" ? "light" : "dark";
      return nextTheme;
    });
  };
  return (
    <>
      <div className="flex h-[48px] border-b border-dark-grey">
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className={clsx(
                menuOpen &&
                  "dark:bg-light-bg dark:text-light-text bg-dark-bg text-dark-text",
                !menuOpen && "border-r border-dark-grey",
                "w-[48px]"
              )}
            >
              <List24Filled />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              className="rounded-b-sm rounded-tr-sm shadow-sm z-10 absolute dark:bg-light-bg dark:text-light-text bg-dark-bg text-dark-text h-fit text-2xl font-medium"
            >
              <div className="container w-screen">
                <DropdownMenu.Item
                  onClick={() => setMenuOpen(false)}
                  className="transition flex items-center h-[48px] p-2 border-b border-dark-grey hover:cursor-pointer hover:opacity-90 dark:hover:bg-dark-bg/10"
                >
                  <Link href={"/members"}>Members</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => setMenuOpen(false)}
                  className="transition flex items-center h-[48px] p-2 border-b border-dark-grey hover:cursor-pointer hover:opacity-90 dark:hover:bg-dark-bg/10"
                >
                  <Link href="/speeches">Speeches</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => setMenuOpen(false)}
                  className="transition flex items-center h-[48px] p-2 hover:cursor-pointer hover:opacity-90 dark:hover:bg-dark-bg/10"
                >
                  <Link href="/bills/summary">Bills</Link>
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className="flex flex-1 gap-2 items-center justify-end text-3xl p-2">
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={theme === "darK"}
            onClick={toggleTheme}
            className={clsx(
              "flex items-center rounded-full transition dark:text-dark-text text-light-text",
              "hover:bg-light-grey/60"
            )}
          >
            <DarkTheme20Filled />
          </button>
          <Link href="/" className="font-medium hover:opacity-90 transition">
            Hansard.
          </Link>
        </div>
      </div>
    </>
  );
}
