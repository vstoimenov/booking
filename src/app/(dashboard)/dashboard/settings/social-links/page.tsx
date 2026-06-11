import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Link2,
  Search,
  Share2,
  Sparkles,
  Video,
} from "lucide-react";

import { SocialLinkCopyButton } from "@/components/settings/social-link-copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserBusiness } from "@/lib/business/current";

export const dynamic = "force-dynamic";

type SocialPlatform = {
  key: string;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  explanation: string;
  cta: string;
  instructions: string;
  accentClassName: string;
  icon: typeof Share2;
};

const platforms: SocialPlatform[] = [
  {
    key: "instagram",
    name: "Instagram",
    source: "instagram",
    medium: "bio",
    campaign: "booking",
    explanation:
      "Линк за bio, story highlights или автоматичен отговор в Instagram.",
    cta: "Запази час тук 👇",
    instructions:
      "Постави линка в полето Website/Bio и използвай CTA текста в описанието на профила или в story.",
    accentClassName: "bg-[#fbe8ef] text-[#a72b61] ring-[#f1bfd4]",
    icon: Sparkles,
  },
  {
    key: "tiktok",
    name: "TikTok",
    source: "tiktok",
    medium: "bio",
    campaign: "booking",
    explanation:
      "Линк за TikTok профил, който изпраща зрителите директно към заявка.",
    cta: "Запази час от линка в профила",
    instructions:
      "Постави линка в Bio/Website полето и го спомени във видеата, когато каниш хората да запазят час.",
    accentClassName: "bg-[#e8fbf7] text-[#0f6b62] ring-[#b7e6df]",
    icon: Video,
  },
  {
    key: "facebook",
    name: "Facebook",
    source: "facebook",
    medium: "profile",
    campaign: "booking",
    explanation:
      "Линк за Facebook страница, постове и бутона за контакт в профила.",
    cta: "Запази час онлайн",
    instructions:
      "Добави линка в About секцията, pinned post или бутона за действие на страницата.",
    accentClassName: "bg-[#edf5ff] text-[#28577f] ring-[#c6d9ef]",
    icon: Share2,
  },
  {
    key: "google",
    name: "Google Business Profile",
    source: "google",
    medium: "business_profile",
    campaign: "booking",
    explanation:
      "Линк за Google Business Profile, за да идват локалните търсения като заявки.",
    cta: "Линк за записване в Google профила",
    instructions:
      "Постави линка в Booking/Appointment URL или Website секцията на Google Business Profile.",
    accentClassName: "bg-[#fff6e6] text-[#7a4f12] ring-[#dfc8a2]",
    icon: Search,
  },
];

function getOriginFromHeaders(headersList: Headers) {
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function buildSocialLink(origin: string, slug: string, platform: SocialPlatform) {
  const url = new URL(`/b/${slug}`, origin);
  url.searchParams.set("utm_source", platform.source);
  url.searchParams.set("utm_medium", platform.medium);
  url.searchParams.set("utm_campaign", platform.campaign);

  return url.toString();
}

function SocialLinksError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим социалните линкове</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function SocialLinksSettingsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/settings/social-links");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <SocialLinksError message={current.message} />;
  }

  const headersList = await headers();
  const origin = getOriginFromHeaders(headersList);
  const publicPageUrl = new URL(`/b/${current.business.publicSlug}`, origin).toString();
  const links = platforms.map((platform) => ({
    ...platform,
    link: buildSocialLink(origin, current.business.publicSlug, platform),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            className="mb-3 justify-start px-0 text-[#575048] hover:bg-transparent"
          >
            <Link href="/dashboard/settings">
              <ArrowLeft className="size-4" />
              Обратно към настройките
            </Link>
          </Button>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Линкове за социални мрежи
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Копирай готови линкове за Instagram, TikTok, Facebook и Google.
            Всяка заявка от тях ще се отчита с правилния източник в запитванията
            и анализите.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-[#d8d0c2] bg-white text-[#16372f] hover:bg-[#f1ebe0]"
        >
          <Link href={publicPageUrl} target="_blank">
            <ExternalLink className="size-4" />
            Отвори публичната страница
          </Link>
        </Button>
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#16372f] text-white">
              <Link2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Основна страница за заявки</p>
              <p className="mt-1 break-all text-sm text-[#69655e]">
                {publicPageUrl}
              </p>
            </div>
          </div>
          <SocialLinkCopyButton link={publicPageUrl} label="Копирай основния линк" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {links.map((platform) => (
          <Card key={platform.key} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg ring-1 ${platform.accentClassName}`}
                >
                  <platform.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-xl">{platform.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {platform.explanation}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#575048]">
                  Готов линк
                </p>
                <Input
                  readOnly
                  value={platform.link}
                  className="h-auto min-h-11 bg-white py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                  <p className="text-xs uppercase text-[#8a8176]">CTA текст</p>
                  <p className="mt-2 text-sm font-medium">{platform.cta}</p>
                </div>
                <div className="rounded-lg border border-[#e6ded1] bg-white p-4">
                  <p className="text-xs uppercase text-[#8a8176]">
                    Къде да го сложиш
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#575048]">
                    {platform.instructions}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SocialLinkCopyButton link={platform.link} />
                <Button
                  asChild
                  variant="outline"
                  className="justify-start border-[#d8d0c2] bg-white"
                >
                  <Link href={platform.link} target="_blank">
                    <ExternalLink className="size-4" />
                    Отвори линка
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
