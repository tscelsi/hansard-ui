"use client"

import React from "react";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { Dismiss12Filled } from "@fluentui/react-icons";

type DismissableBadgeProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onDismiss?: () => void; 
}

export default function DismissableBadge({
  children,
  className = "",
  title,
  onDismiss,
}: DismissableBadgeProps) {
  const base =
    "flex items-center gap-1 w-fit h-fit text-xs px-1 py-0.5 rounded-md border font-semibold border-light-grey dark:border-gray-200";
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