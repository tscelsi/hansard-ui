"use client";

import { BillDiscussionType } from "@/lib/bills_queries";
import { formatDate } from "@/lib/date";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className={clsx(instrumentSans.className, "font-semibold")}>
    {children}
  </strong>
);

export const BillsCarousel = ({ data }: { data: BillDiscussionType[] }) => {
  const [emblaRef] = useEmblaCarousel();
  return (
    <div className="embla overflow-hidden p-2" ref={emblaRef}>
      <div className="embla__container flex">
        {data.map((bill) => (
          <div
            key={bill.bill_id}
            className="flex flex-col gap-1 border border-dark-grey rounded-md p-2 min-w-0 flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_33%] mr-2 embla__slide"
          >
            <Link href={`/bills/details/${encodeURIComponent(bill.bill_id)}`}>
              <h5 className="text-lg font-semibold hover:underline truncate">
                {bill.bill_title.slice(0, 80)}
                {bill.bill_title.length > 80 ? "…" : ""}
              </h5>
              <p className={clsx(instrumentSans.className, "text-sm")}>
                <Strong>{bill.speech_count}</Strong> speeches total.{" "}
                <Strong>{bill.talker_ids.length}</Strong> distinct speakers.
                Latest speech on{" "}
                <Strong>{formatDate(bill.latest_speech_date)}</Strong>
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
