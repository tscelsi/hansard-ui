"use client";

import { ChevronDown12Regular } from "@fluentui/react-icons";
import * as Select from "@radix-ui/react-select";
import { SentimentGroupByType } from "app/bills/[id]/page";
import { instrumentSans, lora } from "app/fonts";
import clsx from "clsx";
import { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function Menu({
  defaultValue = "speech",
}: {
  defaultValue?: SentimentGroupByType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (
    defaultValue !== "speech" &&
    defaultValue !== "member" &&
    defaultValue !== "party"
  ) {
    defaultValue = "speech";
  }
  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const handleValueChange = (value: string) => {
    router.push(
      (pathname + "?" + createQueryString("sentimentGroupBy", value)) as Route,
      { scroll: false }
    );
  };

  return (
    <Select.Root defaultValue={defaultValue} onValueChange={handleValueChange}>
      <Select.Trigger
        className={clsx(
          instrumentSans.className,
          "text-sm underline hover:opacity-75 transition"
        )}
        aria-label="Options"
      >
        <Select.Value />
        <Select.Icon className="ml-2">
          <ChevronDown12Regular />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="text-light-text bg-light-bg dark:bg-dark-bg dark:text-dark-text border border-dark-grey rounded-md shadow-md">
          <Select.Viewport className="flex flex-col">
            <Select.Group>
              <Select.Label className={clsx(lora.className, "px-2 py-1 font-medium border-b border-dark-grey")}>
                Group Sentiment
              </Select.Label>
              <div className="w-full border-dark-grey border-b h-1"></div>
              {["speech", "member", "party"].map((value) => (
                <Select.Item
                  key={value}
                  value={value}
                  className={clsx(
                    instrumentSans.className,
                    "px-2 py-1 hover:bg-dark-grey/50 cursor-pointer border-b border-dark-grey last:border-b-0"
                  )}
                >
                  <Select.ItemText>{`by ${value}`}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
