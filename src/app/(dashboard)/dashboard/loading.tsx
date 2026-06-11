import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-36 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-4 w-32 animate-pulse rounded bg-[#e4dccf]" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-16 animate-pulse rounded bg-[#e4dccf]" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#ebe4d8]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
