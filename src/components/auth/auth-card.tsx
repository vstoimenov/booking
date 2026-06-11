import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerLabel: string;
  footerHref: string;
  footerCta: string;
  message?: string;
  error?: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footerLabel,
  footerHref,
  footerCta,
  message,
  error,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-[#ded8cb] bg-white/95 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-[#161616]">
          {title}
        </CardTitle>
        <p className="text-sm leading-6 text-[#69655e]">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {message ? (
          <p className="rounded-md border border-[#b9d8c5] bg-[#edf8f0] px-3 py-2 text-sm text-[#245d36]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-[#efb3a5] bg-[#fff1ed] px-3 py-2 text-sm text-[#9d321d]">
            {error}
          </p>
        ) : null}
        {children}
        <p className="text-center text-sm text-[#69655e]">
          {footerLabel}{" "}
          <Link href={footerHref} className="font-medium text-[#16372f]">
            {footerCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
