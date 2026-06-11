import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded-md bg-[#e4dccf]" />
          <div className="h-10 w-56 animate-pulse rounded-md bg-[#e4dccf]" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-20 animate-pulse rounded-md bg-[#e4dccf]"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
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

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-5 w-44 animate-pulse rounded bg-[#e4dccf]" />
              <div className="h-4 w-64 animate-pulse rounded bg-[#ebe4d8]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  className="h-12 animate-pulse rounded-lg bg-[#eee7da]"
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
