import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getActiveWorkspaceMembership } from "@/lib/auth/partner";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B8%D1%82%D0%B5%20%D0%BB%D0%B8%D0%BF%D1%81%D0%B2%D0%B0%D1%82.",
    );
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

  if (partnerMembership || businessMembership) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#161616]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[0.72fr_1fr] lg:px-8">
        <section className="flex flex-col justify-between rounded-lg border border-[#ded7c8] bg-[#16372f] p-6 text-white lg:min-h-[calc(100vh-40px)] lg:p-8">
          <div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-md bg-white text-sm text-[#16372f]">
                LO
              </span>
              LocalOps White Label
            </div>
            <Badge className="mt-8 border-white/20 bg-white/10 text-white hover:bg-white/10">
              Регистрация на бизнес
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              Настрой салона си и започни да приемаш запитвания.
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-white/75">
              Тази еднократна настройка създава бизнес профил, достъп като
              собственик и основен брандинг за бъдещата страница за резервации.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/80 sm:grid-cols-3 lg:grid-cols-1">
            {["Бизнес профил", "Достъп като собственик", "Брандинг готов"].map((item) => (
              <div key={item} className="rounded-md border border-white/15 p-3">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center py-8 lg:py-0">
          <div className="w-full">
            <OnboardingForm email={user.email ?? "твоят акаунт"} />
          </div>
        </section>
      </div>
    </main>
  );
}
