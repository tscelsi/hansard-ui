import Link from "next/link";

export const runtime = "nodejs";

export default async function HomePage({}: {}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold h-inherit">Hansard</h1>
      <Link href="/members">
        <h2 className="hover:underline">members</h2>
      </Link>
      <Link href="/speeches">
        <h2 className="hover:underline">speeches</h2>
      </Link>
    </div>
  );
}
