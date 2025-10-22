"use client";

import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useEffect, useMemo, useState } from "react";
import Badge from "./Badge";
import {
  Checkmark12Filled,
  ChevronDown16Filled,
  ChevronDown20Filled,
} from "@fluentui/react-icons";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type Props = {
  name: string;
  label?: string;
  onChange: (selected: string[]) => void;
  options: MultiSelectOption[];
  defaultValues?: string[];
  placeholder?: string;
  className?: string;
};

export default function MultiSelect({
  name,
  label,
  options,
  onChange,
  defaultValues = [],
  placeholder = "Select…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValues);

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o] as const));
    return selected
      .map((v) => map.get(v))
      .filter(Boolean) as MultiSelectOption[];
  }, [selected, options]);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  const toggle = (v: string) => {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  return (
    <div className="border-b border-light-text min-h-[64px]">
      {/* Hidden inputs for form submission (GET) */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="py-2 flex w-full min-w-[220px] items-center justify-between gap-2 bg-transparent text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-haspopup="listbox"
          >
            <div className="flex flex-col gap-1 pl-2">
              <label htmlFor={name} className="text-xs font-bold">
                {label || name}
              </label>
              <span className="flex min-w-0 flex-wrap flex-1 items-center gap-1">
                {selectedOptions.length === 0 && (
                  <span className="truncate">{placeholder}</span>
                )}
                {selectedOptions.length > 0 && selectedOptions.length <= 5 && (
                  <>
                    {selectedOptions.map((opt) => (
                      <Badge
                        dark
                        key={opt.value}
                        onDismiss={() => toggle(opt.value)}
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </>
                )}
                {selectedOptions.length > 5 && (
                  <Badge
                    dark
                    title={selectedOptions.map((o) => o.label).join(", ")}
                    className="text-gray-300 border-gray-700"
                  >
                    +{selectedOptions.length}
                  </Badge>
                )}
              </span>
            </div>
            <div className="pr-2">
              <ChevronDown20Filled />
            </div>
          </button>
        </Popover.Trigger>
        <Popover.Content
          sideOffset={8}
          className="z-50 max-h-80 w-[260px] overflow-auto rounded-md border border-gray-700 bg-gray-900 p-1 shadow-xl focus:outline-none"
        >
          <ul role="listbox" className="divide-y divide-gray-800">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <li key={opt.value} className="">
                  <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-gray-200 hover:bg-gray-800">
                    <Checkbox.Root
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      className="flex h-4 w-4 items-center justify-center rounded border border-gray-600 data-[state=checked]:bg-indigo-600"
                    >
                      <Checkbox.Indicator>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5 text-white"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25A1 1 0 016.52 9.05l2.543 2.543 6.543-6.543a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
