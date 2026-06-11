export default function BookingPageLoading() {
  return (
    <main className="min-h-screen bg-[#f7f2e9] px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="h-80 animate-pulse rounded-3xl bg-[#e5dccd]" />
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-[#e5dccd]"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-[#e5dccd]" />
        </div>
      </div>
    </main>
  );
}
