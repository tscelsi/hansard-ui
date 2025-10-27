import React from "react";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { Dismiss12Filled } from "@fluentui/react-icons";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  dark?: boolean;
  onDismiss?: () => void;
};

export default function Badge({
  children,
  className = "",
  title,
  dark = true,
  onDismiss,
}: BadgeProps) {
  const base =
    "flex items-center gap-1 w-fit h-fit text-xs px-1 py-0.5 rounded-md border font-semibold border-gray-200";
  const darkStyles = "text-dark-text bg-dark-bg";
  const lightStyles = "text-light-text bg-light-bg";
  return (
    <span
      title={title}
      className={clsx(
        base,
        instrumentSans.className,
        className,
        dark ? darkStyles : lightStyles
      )}
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

export const HouseBadge = ({
  house,
}: {
  house: "hor" | "senate";
}) => {
  return (
    <Badge
      className={clsx(
        house === "hor" ? "bg-green-900/70 text-white" : "bg-red-900/70 text-white"
      )}
    >
      {house === "hor" ? "House" : "Senate"}
    </Badge>
  );
};