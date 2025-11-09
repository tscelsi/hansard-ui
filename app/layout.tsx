import NavBar from "components/NavBar";
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from "next-themes";
import "./globals.css";
import type { Metadata } from "next";
import { instrumentSans, lora } from "./fonts";
import clsx from "clsx";
import { ArrowUpRight12Filled } from "@fluentui/react-icons";

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
            <main className="container m-auto sm:border-x border-dark-grey min-h-[calc(100vh-96px)]">
              {children}
            </main>
            <footer
              className={clsx(
                instrumentSans.className,
                "m-auto sm:border-x border-dark-grey container h-[48px] flex justify-between items-center px-4 text-sm"
              )}
            >
              <div className={clsx("dark:text-dark-grey text-light-grey")}>
                made by tom.s © {new Date().getFullYear()}
              </div>
              <a
                href="https://my-blog-psi-opal.vercel.app/public/ddcfafb2-34a3-47a8-868b-f58e287ebd0a"
                className="flex gap-1 items-center hover:underline hover:opacity-70 transition text-link-blue"
                target="_blank"
              >
                get in touch
                <ArrowUpRight12Filled />
              </a>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
