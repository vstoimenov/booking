import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SocialLinksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-full max-w-lg animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardContent className="p-5">
          <div className="h-16 animate-pulse rounded-lg bg-[#eee7da]" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader>
              <div className="h-6 w-40 animate-pulse rounded bg-[#e4dccf]" />
              <div className="h-4 w-64 animate-pulse rounded bg-[#ebe4d8]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-11 animate-pulse rounded bg-[#eee7da]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-lg bg-[#eee7da]" />
                <div className="h-24 animate-pulse rounded-lg bg-[#eee7da]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
