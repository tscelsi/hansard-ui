import React from "react";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { Dismiss12Filled } from "@fluentui/react-icons";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onDismiss?: () => void;
};

export default function Badge({
  children,
  className = "",
  title,
  onDismiss,
}: BadgeProps) {
  const base =
    "flex items-center gap-1 w-fit h-fit text-xs px-1 py-0.5 rounded-md border font-semibold border-light-grey dark:border-gray-200 dark:text-dark-text dark:bg-dark-bg text-light-text bg-light-bg";
  return (
    <span
      title={title}
      className={clsx(base, instrumentSans.className, className)}
    >
      {children}
      {onDismiss && (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="flex items-center"
        >
          <Dismiss12Filled />
        </span>
      )}
    </span>
  );
}

export const HouseBadge = ({ house }: { house: "hor" | "senate" }) => {
  return (
    <Badge
      className={clsx(house === "hor" ? "bg-hor/60 dark:bg-hor/70" : "bg-senate/60 dark:bg-senate/60")}
    >
      {house === "hor" ? "House" : "Senate"}
    </Badge>
  );
};

export const IconBadge = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Badge className="flex items-center gap-1">
      {icon}
      {children}
    </Badge>
  );
};
