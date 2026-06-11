import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset } from "../actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Възстанови паролата"
      subtitle="Ще изпратим защитен линк за смяна на паролата на имейла в акаунта."
      footerLabel="Сети се за нея?"
      footerHref="/login"
      footerCta="Назад към вход"
      error={params.error}
    >
      <form action={requestPasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Имейл</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <SubmitButton pendingLabel="Изпращане...">Изпрати линк</SubmitButton>
      </form>
    </AuthCard>
  );
}
