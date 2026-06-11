import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-36 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-52 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader>
          <div className="h-5 w-28 animate-pulse rounded bg-[#e4dccf]" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[#ebe4d8]" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded bg-[#e4dccf]"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader>
          <div className="h-5 w-32 animate-pulse rounded bg-[#e4dccf]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[#ebe4d8]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded bg-[#e4dccf]"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
