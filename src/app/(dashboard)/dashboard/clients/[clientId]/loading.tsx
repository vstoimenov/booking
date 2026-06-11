export default function ClientDetailsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="h-32 animate-pulse rounded-2xl bg-[#e8e0d4]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 animate-pulse rounded-2xl bg-[#e8e0d4]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#e8e0d4]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#e8e0d4]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#e8e0d4]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-[620px] animate-pulse rounded-2xl bg-[#e8e0d4]" />
        <div className="h-[620px] animate-pulse rounded-2xl bg-[#e8e0d4]" />
      </div>
    </div>
  );
}
