import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#161616]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#16372f] text-sm text-white">
            LO
          </span>
          LocalOps White Label
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </div>
    </main>
  );
}
