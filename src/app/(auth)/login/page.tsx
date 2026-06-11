import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Добре дошъл отново"
      subtitle="Управлявай запитвания, резервации, клиенти и последваща комуникация от едно бизнес табло."
      footerLabel="Нов си в LocalOps?"
      footerHref="/register"
      footerCta="Създай акаунт"
      message={params.message}
      error={params.error}
    >
      <form action={signIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Имейл</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Парола</Label>
            <a href="/forgot-password" className="text-sm font-medium text-[#16372f]">
              Забравена?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton pendingLabel="Влизане...">Вход</SubmitButton>
      </form>
    </AuthCard>
  );
}
