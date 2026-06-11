import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LeadNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
      <Card className="w-full border-[#ded7c8] bg-[#fbfaf6]">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-[#69655e]">404</p>
          <h1 className="mt-3 text-2xl font-semibold">
            Запитването не е намерено
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#69655e]">
            Този lead не съществува или не е част от текущия бизнес.
          </p>
          <Button asChild className="mt-6 bg-[#16372f] text-white hover:bg-[#214b42]">
            <Link href="/dashboard/leads">Към запитванията</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
