"use client";
import { ChevronDown12Filled } from "@fluentui/react-icons";
import * as RadixAccordion from "@radix-ui/react-accordion";
import clsx from "clsx";

export interface AccordionItem {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
}


type AccordionSingleProps = {
  items: AccordionItem[];
  type?: "single";
  defaultValue?: string;
  className?: string;
};
type AccordionMultipleProps = {
  items: AccordionItem[];
  type: "multiple";
  defaultValue?: string[];
  className?: string;
};
type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export const Accordion = (props: AccordionProps) => {
  const { items, type = "single", defaultValue, className } = props as any;
  return (
    <RadixAccordion.Root
      type={type}
      defaultValue={defaultValue}
      className={clsx("w-full bg-dark-bg", className)}
    >
  {items.map((item: AccordionItem) => (
        <RadixAccordion.Item
          key={item.value}
          value={item.value}
          className="border-b border-dark-grey last:border-b-0 text-sm"
        >
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="flex w-full items-center justify-between px-2 py-2 font-medium text-left focus:outline-none">
              {item.trigger}
              <ChevronDown12Filled className="ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="first:border-t-none border-t-1 px-2 pb-2 animate-accordion-down">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
};

export default Accordion;
