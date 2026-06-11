import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadDetailsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-44 animate-pulse rounded bg-[#e4dccf]" />
        <div className="h-10 w-full max-w-md animate-pulse rounded bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-[#ebe4d8]" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-5 w-36 animate-pulse rounded bg-[#e4dccf]" />
              <div className="h-4 w-56 animate-pulse rounded bg-[#ebe4d8]" />
            </CardHeader>
            <CardContent>
              <div className="h-40 animate-pulse rounded bg-[#e4dccf]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
