import NavBar from "components/NavBar";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import type { Metadata } from "next";
import { lora } from "./fonts";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Augov Hansard Tool",
  description: "Insights into Australian parliamentary speeches",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={clsx("text-[14px] h-full")}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class">
          <div
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
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
