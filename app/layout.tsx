import NavBar from "components/NavBar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import type { Metadata } from "next";
import { instrumentSans, lora } from "./fonts";
import clsx from "clsx";
import { ArrowUpRight12Filled } from "@fluentui/react-icons";
import OutgoingLink from "components/OutgoingLink";

export const metadata: Metadata = {
  title: "Hansard Insights",
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
              <OutgoingLink href="https://my-blog-psi-opal.vercel.app/public/ddcfafb2-34a3-47a8-868b-f58e287ebd0a">
                get in touch
              </OutgoingLink>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
