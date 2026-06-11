"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (async () => {
      const headerStore = await headers();
      return headerStore.get("origin") ?? "http://localhost:3000";
    })()
  );
}

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function localizeAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Невалиден имейл или парола.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Потвърди имейла си, преди да влезеш.";
  }

  if (normalized.includes("user already registered")) {
    return "Вече има акаунт с този имейл.";
  }

  if (normalized.includes("password")) {
    return "Провери паролата и опитай отново.";
  }

  return message;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeMessage(localizeAuthError(error.message))}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeMessage(localizeAuthError(error.message))}`);
  }

  redirect(
    `/login?message=${encodeMessage("Провери имейла си, за да потвърдиш акаунта.")}`,
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeMessage(localizeAuthError(error.message))}`,
    );
  }

  redirect(
    `/login?message=${encodeMessage("Изпратихме инструкции за смяна на паролата.")}`,
  );
}
