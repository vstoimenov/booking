import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BookingNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2e9] px-4 text-[#171412]">
      <div className="w-full max-w-md rounded-2xl border border-[#ded7c8] bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-[#69655e]">404</p>
        <h1 className="mt-3 text-2xl font-semibold">
          Страницата не е активна
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#69655e]">
          Този booking линк не съществува или бизнесът временно не приема
          заявки.
        </p>
        <Button asChild className="mt-6 bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="/">Към LocalOps</Link>
        </Button>
      </div>
    </main>
  );
}
