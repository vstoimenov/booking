import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AutomationTemplateEditLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-10 w-full max-w-lg animate-pulse rounded-md bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-[#ebe4d8]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader>
            <div className="h-5 w-44 animate-pulse rounded bg-[#e4dccf]" />
            <div className="h-4 w-64 animate-pulse rounded bg-[#ebe4d8]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 animate-pulse rounded bg-[#eee7da]" />
            <div className="h-10 animate-pulse rounded bg-[#eee7da]" />
            <div className="h-56 animate-pulse rounded bg-[#eee7da]" />
          </CardContent>
        </Card>
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader>
            <div className="h-5 w-28 animate-pulse rounded bg-[#e4dccf]" />
          </CardHeader>
          <CardContent>
            <div className="h-48 animate-pulse rounded bg-[#eee7da]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
