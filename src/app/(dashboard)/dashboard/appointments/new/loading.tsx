import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewAppointmentLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-44 animate-pulse rounded bg-[#e4dccf]" />
        <div className="h-10 w-40 animate-pulse rounded bg-[#e4dccf]" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-[#ebe4d8]" />
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader>
          <div className="h-6 w-36 animate-pulse rounded bg-[#e4dccf]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[#ebe4d8]" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded bg-[#e4dccf]" />
            <div className="h-80 animate-pulse rounded bg-[#e4dccf]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
