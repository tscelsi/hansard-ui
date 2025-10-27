import { formatDate } from "@/lib/date";
import { getDb } from "@/lib/mongodb";
import Link from "next/link";

// Quick and simple Bill type
interface Bill {
  id: string;
  date: Date;
  title: string;
}

async function getBills(): Promise<Bill[]> {
  const db = await getDb();
  // Try to get all unique bills with id and title
  const bills = await db
    .collection("parts")
    .aggregate<Bill>([
      { $addFields: { bill_ids_size: { $size: "$bill_ids" } } },
      {
        $match: {
          bill_ids_size: { $eq: 1 },
          $or: [{ speech_seq: { $eq: 0 } }, { type: "first_reading" }],
          bill_ids: { $ne: null },
        },
      },
      { $unwind: "$bill_ids" },
      { $match: { bill_ids: { $ne: "" } } },
      {
        $sort: {
          debate_seq: 1,
          subdebate_1_seq: 1,
          subdebate_2_seq: 1,
          speech_seq: 1,
        },
      },
      {
        $group: {
          _id: "$bill_ids",
          title: { $first: "$subdebate_1_title" },
          date: { $first: "$date" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          date: 1,
        },
      },
      { $sort: { date: -1, title: 1 } },
    ])
    .toArray();
  // Map to Bill type (ensure id and title are strings)
  return bills;
}

export default async function BillsPage() {
  const bills = await getBills();
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">Bills</h1>
      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
        {bills.length === 0 && (
          <li className="p-4 text-gray-500">No bills found.</li>
        )}
        {bills.map((bill) => (
          <li key={bill.id} className="p-4 hover:bg-gray-50 transition">
            <Link
              href={`/bills/${bill.id}`}
              className="text-blue-700 hover:underline font-medium"
            >
              {bill.title || bill.id}
            </Link>
            <div className="text-sm text-gray-500">
              {bill.date ? formatDate(bill.date) : "Date not available"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
