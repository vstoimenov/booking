import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ServicesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-36 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-44 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-[#e4dccf]" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[#ebe4d8]" />
            </CardHeader>
            <CardContent>
              <div className="h-16 w-full animate-pulse rounded bg-[#ebe4d8]" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-[#e4dccf]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
