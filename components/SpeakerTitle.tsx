import React from "react";

type SpeakerTitleProps = {
  name: string;
  electorate?: string | null;
  date: string;
};

export default function SpeakerTitle({
  name,
  electorate,
  date,
}: SpeakerTitleProps) {
  return (
    <div>
      <p className="text-lg font-bold">
        {name || "—"}
        {electorate && <span> ({electorate})</span>}
      </p>
      <span className="text-gray-500 dark:text-gray-400">
        {new Date(date).toLocaleDateString()}
      </span>
    </div>
  );
}
