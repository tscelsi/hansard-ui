"use client";
import { formatDateForChart, formatDateString } from "@/lib/date";
import {
  PartySpeechProportionsResult,
  SpeechesOverTimeResult,
} from "@/lib/bill_query_types";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const colourMap: Record<string, string> = {
  LNP: "#1E1B56",
  LP: "#1E1B56",
  NATS: "#344F33",
  ALP: "#6C242A",
  AG: "#007236",
  IND: "#008080",
  CA: "#FF5800",
  AV: "#AC0E4B",
};

const house_display_map: Record<"hor" | "senate", string> = {
  hor: "House of Representatives",
  senate: "Senate",
};

export const SpeechCountOverTimeByPartChart = ({
  data,
}: {
  data: SpeechesOverTimeResult[];
}) => {
  function formatXAxis(date: Date) {
    return formatDateForChart(date);
  }

  const { theme } = useTheme();

  return (
    <div className="w-full h-[64px]">
      <ResponsiveContainer>
        <BarChart
          responsive
          data={data}
          layout="horizontal"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            axisLine={true}
            tickLine={false}
            interval="preserveStartEnd"
            tick={
              // Custom tick renderer for font and size
              (props) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y + 10}
                    className={clsx(instrumentSans.className)}
                    fill={theme === "dark" ? "#E6E4D4" : "#131016"}
                    fontSize={12}
                    textAnchor="middle"
                  >
                    {formatXAxis(payload.value)}
                  </text>
                );
              }
            }
          />
          <YAxis type="number" hide />
          <Tooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              return (
                <div
                  className={clsx(
                    "rounded-lg bg-dark-bg text-dark-text shadow-lg px-3 py-2 border border-dark-grey min-w-[120px]",
                    instrumentSans.className
                  )}
                >
                  <div className="text-xs font-semibold mb-1 text-dark-text">{`Date: ${formatDateString(
                    label as string
                  )}`}</div>
                  {payload.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">
                        {house_display_map[entry.name as "hor" | "senate"] ||
                          "Count"}
                      </span>
                      <span className="ml-2">{entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Bar stackId="a" dataKey="hor" fill="#4E8A76" />
          <Bar stackId="a" dataKey="senate" fill="#9C351D" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PartySpeechProportionChart = ({
  data,
}: {
  data: PartySpeechProportionsResult;
}) => {
  console.log(data);
  return (
    <div className="h-[20px] flex flex-row gap-0.5">
      {Object.entries(data).map(([party, proportion]) => (
        <div
          key={party}
          className={clsx(
            "first:rounded-l-lg flex items-center justify-center last:rounded-r-lg h-full text-xs font-semibold text-dark-text overflow-hidden",
            instrumentSans.className
          )}
          style={{
            flexBasis: `${proportion}%`,
            backgroundColor: colourMap[party] || "#000000",
          }}
        >
          {party}
        </div>
      ))}
    </div>
  );
};
