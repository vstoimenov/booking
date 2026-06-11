import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getActiveWorkspaceMembership } from "@/lib/auth/partner";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=Supabase%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B8%D1%82%D0%B5%20%D0%BB%D0%B8%D0%BF%D1%81%D0%B2%D0%B0%D1%82.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { partnerMembership, businessMembership } =
    await getActiveWorkspaceMembership(user.id);

  if (!partnerMembership && !businessMembership) {
    redirect("/onboarding");
  }

  const workspaceLabel = partnerMembership
    ? "Партньорско пространство"
    : "Бизнес пространство";
  const workspaceTitle = partnerMembership
    ? "Операции на агенцията"
    : "Управление на бизнеса";

  const initials =
    user.email
      ?.split("@")[0]
      .slice(0, 2)
      .toUpperCase() ?? "LO";

  return (
    <main className="flex min-h-screen bg-[#f5f1e8] text-[#161616]">
      <Sidebar />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-[#ded7c8] bg-[#fbfaf6] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <div>
              <p className="text-sm text-[#69655e]">{workspaceLabel}</p>
              <p className="font-semibold">{workspaceTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-[#e8efe9] text-[#16372f]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <form action={signOut}>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Изход
              </Button>
            </form>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
