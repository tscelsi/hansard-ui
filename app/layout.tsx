import NavBar from "components/NavBar";
import "./globals.css";
import type { Metadata } from "next";
import { playfair } from "./fonts";
import { getDb } from "@/lib/mongodb";

export const metadata: Metadata = {
  title: "Augov Hansard Tool",
  description: "Insights into Australian parliamentary speeches",
};

async function fetchFilters() {
  const db = await getDb();
  // Options for filters
  const [categories, parties, electorates] = await Promise.all([
    db.collection("speeches").distinct("debate_category", {
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
    <html lang="en" className="dark">
      <body
        className={`${playfair.className} text-[15px] md:text-[18px] leading-7 text-dark-text bg-dark-bg`}
      >
        <header className="">
          <div className="container m-auto sm:border-x">
            <NavBar filtersPromise={filtersPromise} />
          </div>
        </header>
        <main className="container m-auto sm:border-x">{children}</main>
      </body>
    </html>
  );
}
