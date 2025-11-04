"use client";

import { SentimentResult } from "@/lib/queries";
import { getSpeechTonePositivity, Tone } from "@/lib/speech_tone";
import { Location12Filled } from "@fluentui/react-icons";
import { instrumentSans, lora } from "app/fonts";
import clsx from "clsx";
import Badge, { HouseBadge, IconBadge } from "components/Badge";
import {
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  Label,
  Cell,
  ZAxis,
} from "recharts";
import { SentimentGroupByType } from "app/bills/details/[id]/page";

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

type SentimentResultWithToneValue = {
  tone_value: number;
  count?: number;
} & SentimentResult;

const formatData = (
  data: SentimentResultWithToneValue[],
  groupBy: SentimentGroupByType
) => {
  const isFiniteNumber = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);
  if (groupBy === "speech") {
    // Ensure we drop obviously bad points
    return data.filter((d) => isFiniteNumber(d.tone_value));
  } else if (groupBy === "member") {
    const memberMap: Record<
      string,
      {
        talker_id: string;
        name: string;
        party: string;
        electorate: string;
        house: "hor" | "senate";
        stance_sum: number;
        tone_values: number[];
        count: number;
      }
    > = {};
    data.forEach((d) => {
      if (!memberMap[d.talker_id]) {
        memberMap[d.talker_id] = {
          talker_id: d.talker_id,
          name: d.name,
          party: d.party,
          electorate: d.electorate,
          house: d.house,
          stance_sum: d.stance,
          tone_values: isFiniteNumber(d.tone_value) ? [d.tone_value] : [],
          count: 1,
        };
      } else {
        memberMap[d.talker_id].stance_sum += d.stance;
        if (isFiniteNumber(d.tone_value)) {
          memberMap[d.talker_id].tone_values.push(d.tone_value);
        }
        memberMap[d.talker_id].count += 1;
      }
    });
    return Object.values(memberMap)
      .map((m) => {
        const tones = m.tone_values;
        const avgTone = tones.length
          ? tones.reduce((a, b) => a + b, 0) / tones.length
          : 0.5; // fallback to neutral if no valid tones
        return {
          talker_id: m.talker_id,
          name: m.name,
          party: m.party,
          electorate: m.electorate,
          house: m.house,
          stance: m.stance_sum / m.count,
          tone: [],
          tone_value: avgTone,
          count: m.count,
        };
      })
      .filter((d) => isFiniteNumber(d.tone_value));
  } else if (groupBy === "party") {
    const partyMap: Record<
      string,
      {
        party: string;
        stance_sum: number;
        tone_values: number[];
        count: number;
      }
    > = {};
    data.forEach((d) => {
      if (!partyMap[d.party]) {
        partyMap[d.party] = {
          party: d.party,
          stance_sum: d.stance,
          tone_values: isFiniteNumber(d.tone_value) ? [d.tone_value] : [],
          count: 1,
        };
      } else {
        partyMap[d.party].stance_sum += d.stance;
        if (isFiniteNumber(d.tone_value)) {
          partyMap[d.party].tone_values.push(d.tone_value);
        }
        partyMap[d.party].count += 1;
      }
    });
    return Object.values(partyMap)
      .map((p) => {
        const tones = p.tone_values;
        const avgTone = tones.length
          ? tones.reduce((a, b) => a + b, 0) / tones.length
          : 0.5; // fallback to neutral if no valid tones
        return {
          talker_id: "",
          name: "",
          party: p.party,
          electorate: "",
          house: "hor",
          stance: p.stance_sum / p.count,
          tone: [],
          tone_value: avgTone,
          count: p.count,
        };
      })
      .filter((d) => isFiniteNumber(d.tone_value));
  }
  return data;
};

export const BillSentimentChart = ({
  data,
  groupBy = "speech",
}: {
  data: SentimentResult[];
  groupBy?: SentimentGroupByType;
}) => {
  const dataWithToneValues: SentimentResultWithToneValue[] = data.map((d) => ({
    ...d,
    tone_value: getSpeechTonePositivity(d.tone),
  }));
  const formattedData = formatData(dataWithToneValues, groupBy);
  return (
    <div>
      <div className="w-full h-[172px] pr-8 flex ">
        <div
          className={clsx(
            instrumentSans.className,
            "flex flex-col justify-between items-center gap-2 text-center py-4 text-sm font-semibold"
          )}
        >
          <div>
            <span className="sideways-writing-lr">positive</span>
          </div>
          <div className="border-l border-very-light-grey h-full w-1"></div>
          <div>
            <span className="sideways-writing-lr">negative</span>
          </div>
        </div>
        <ResponsiveContainer>
          <ScatterChart
            layout="horizontal"
            responsive
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            {dataWithToneValues.length === 0 && (
              <Label className={clsx(instrumentSans.className)}>
                🤨 no data!
              </Label>
            )}
            <XAxis
              type="number"
              dataKey="stance"
              name="stance"
              axisLine={false}
              tickLine={false}
              domain={[-1, 1]}
              hide
            />
            {(groupBy === "party" || groupBy === "member") && (
              <ZAxis
                type="number"
                dataKey="count"
                domain={["dataMin", "dataMax"]}
                range={[60, 240]} // pixel size of circles (min/max)
              />
            )}
            <Scatter name="sentiment" data={formattedData}>
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colourMap[entry.party] || "white"}
                />
              ))}
            </Scatter>
            <YAxis
              type="number"
              dataKey="tone_value"
              name="tone"
              width="auto"
              axisLine={false}
              tickLine={false}
              domain={[0, 1]}
              hide
            ></YAxis>
            <Tooltip
              cursor={false}
              content={({ active, payload, label }) => {
                const data: SentimentResultWithToneValue =
                  payload?.[0]?.payload;
                if (!active || !payload || !payload.length || !data)
                  return null;
                return (
                  <div
                    className={clsx(
                      "rounded-lg border border-dark-grey bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text shadow-lg p-2 flex flex-col gap-1 min-w-[160px]",
                      instrumentSans.className
                    )}
                  >
                    <span className={clsx(lora.className, "font-semibold")}>
                      {groupBy === "party" ? data.party : data.name}
                    </span>
                    {groupBy !== "party" && (
                      <div className="flex flex-wrap gap-1">
                        <Badge>{data.party}</Badge>
                        <IconBadge icon={<Location12Filled />}>
                          {data.electorate}
                        </IconBadge>
                        <HouseBadge house={data.house} />
                      </div>
                    )}
                    <div className="flex flex-col text-sm gap-none">
                      <span>
                        Stance: <strong>{data.stance.toFixed(2)}</strong>
                      </span>
                      <span>
                        Tone: <strong>{data.tone_value.toFixed(2)}</strong>
                      </span>
                      {groupBy !== "speech" && <span>
                        Count: <strong>{data.count}</strong>
                      </span>}
                    </div>
                  </div>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div
        className={clsx(
          instrumentSans.className,
          "flex justify-between items-center px-4 text-sm font-semibold gap-2 sm:gap-8"
        )}
      >
        <span>against</span>
        <div className="border-b border-very-light-grey h-1 w-full"></div>
        <span>neutral</span>
        <div className="border-b border-very-light-grey h-1 w-full"></div>
        <span>supportive</span>
      </div>
    </div>
  );
};
