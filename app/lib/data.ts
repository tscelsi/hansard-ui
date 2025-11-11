import { getDb } from "@/lib/mongodb";
import { cache } from "react";

export const fetchFilters = cache(async () => {
  const db = await getDb();
  // Options for filters
  const [categories, parties, electorates] = await Promise.all([
    db.collection("parts").distinct("debate_category", {
      debate_category: { $ne: null },
    }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("party", { party: { $ne: null } }) as Promise<string[]>,
    db
      .collection("talkers")
      .distinct("electorate", { electorate: { $ne: null } }) as Promise<
      string[]
    >,
  ]);
  return { categories, parties, electorates };
});
