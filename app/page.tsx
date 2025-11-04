import clsx from "clsx";
import Link from "next/link";
import { instrumentSans } from "./fonts";

export const runtime = "nodejs";

export default async function HomePage({}: {}) {
  return (
    <div
      className={clsx(
        "w-full h-full flex flex-col items-center justify-center"
      )}
    >
      <div className={clsx(
         "p-4 flex flex-col gap-4")}>
        <h2 className="text-2xl font-bold h-inherit">
          Uncover discussion in Australian parliament.
        </h2>
        <p className={clsx(
        instrumentSans.className, )}>
          Parliament proceedings are made up primarily of speeches made by
          members of parliament. They make speeches to debate and introduce bills,
          raise issues, and represent their constituents. Explore the speeches,
          the members who made them and explore how different bills are being discussed,
          and the parties involved in passing them.
        </p>
        <div>
          <Link className="text-link-blue hover:underline" href="/members">
            <h2>{">"} Members</h2>
          </Link>
          <Link className="text-link-blue hover:underline" href="/speeches">
            <h2>{">"} Speeches</h2>
          </Link>
          <Link className="text-link-blue hover:underline" href="/bills/summary">
            <h2>{">"} Bills</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
