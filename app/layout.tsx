import NavBar from "components/NavBar";
import "./globals.css";
import type { Metadata } from "next";
import { lora } from "./fonts";
import { getDb } from "@/lib/mongodb";
import clsx from "clsx";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Augov Hansard Tool",
  description: "Insights into Australian parliamentary speeches",
};

async function fetchFilters() {
  const db = await getDb();
  // Options for filters
  const [categories, parties, electorates] = await Promise.all([
    db.collection("parts").distinct("debate_category", {
      debate_category: { $ne: null },
    }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("party", { party: { $ne: null } }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("electorate", { electorate: { $ne: null } }) as Promise<
      string[]
    >,
  ]);
  return { categories, parties, electorates };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const filtersPromise = fetchFilters();


  return (
    <html lang="en" className={clsx("text-[14px] h-full")}>
      {/* Set initial theme before React hydration to avoid flash */}
      <Script id="theme-init" strategy="beforeInteractive">
        {`
          try {
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const useDark = stored ? stored === 'dark' : prefersDark;
            const root = document.documentElement;
            if (useDark) root.classList.add('dark'); else root.classList.remove('dark');
          } catch {}
        `}
      </Script>
      <body
        className={`${lora.className} md:text-[18px] leading-7 bg-light-bg text-light-text dark:text-dark-text dark:bg-dark-bg h-full`}
      >
        <header>
          <div className="container m-auto sm:border-x border-dark-grey">
            <NavBar />
          </div>
        </header>
        <main className="container m-auto sm:border-x border-dark-grey min-h-[calc(100vh-48px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
