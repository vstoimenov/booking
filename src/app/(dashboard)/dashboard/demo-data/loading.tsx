import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DemoDataLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-56 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardContent className="space-y-4 p-5">
          <div className="h-5 w-72 animate-pulse rounded bg-[#e4dccf]" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[#ebe4d8]" />
          <div className="h-10 w-44 animate-pulse rounded bg-[#e4dccf]" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-5 w-36 animate-pulse rounded bg-[#e4dccf]" />
              <div className="h-4 w-full animate-pulse rounded bg-[#ebe4d8]" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
