import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signUp } from "../actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Регистрирай своя салон"
      subtitle="Създай акаунт за локален бизнес и настрой профила си за резервации, запитвания и последваща комуникация."
      footerLabel="Вече имаш акаунт?"
      footerHref="/login"
      footerCta="Вход"
      error={params.error}
    >
      <form action={signUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Име и фамилия</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Имейл</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Парола</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <SubmitButton pendingLabel="Създаване...">Създай акаунт</SubmitButton>
      </form>
    </AuthCard>
  );
}
