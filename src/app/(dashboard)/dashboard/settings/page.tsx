import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  DatabaseZap,
  ExternalLink,
  Palette,
  Share2,
  Settings2,
  Store,
} from "lucide-react";

import { CopyBookingLinkButton } from "@/components/dashboard/copy-booking-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserBusiness } from "@/lib/business/current";

export const dynamic = "force-dynamic";

function SettingsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим настройките</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function SettingsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/settings");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <SettingsError message={current.message} />;
  }

  const settingsCards = [
    {
      title: "Бизнес профил",
      description:
        "Име, категория, контакти, адрес, описание и публичен линк.",
      href: "/dashboard/settings/profile",
      action: "Редактирай профила",
      icon: Store,
    },
    {
      title: "Брандинг",
      description: "Лого и основен цвят за публичната страница за заявки.",
      href: "/dashboard/settings/branding",
      action: "Настрой брандинга",
      icon: Palette,
    },
    {
      title: "Линкове за социални мрежи",
      description:
        "Готови Instagram, TikTok, Facebook и Google линкове с UTM проследяване.",
      href: "/dashboard/settings/social-links",
      action: "Виж линковете",
      icon: Share2,
    },
    {
      title: "Услуги",
      description: "Каталогът с услуги, които клиентите могат да заявят.",
      href: "/dashboard/services",
      action: "Виж услугите",
      icon: ClipboardList,
    },
    {
      title: "Демо данни",
      description:
        "Добави примерни услуги, клиенти, заявки, часове, отзиви и събития за презентация.",
      href: "/dashboard/demo-data",
      action: "Подготви демо",
      icon: DatabaseZap,
    },
    {
      title: "Страница за заявки",
      description: "Публичният линк, който можеш да изпратиш на клиенти.",
      href: `/b/${current.business.publicSlug}`,
      action: "Отвори страницата",
      icon: ExternalLink,
      external: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal">Настройки</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Управлявай данните, които оформят публичната страница и бизнес
            профила.
          </p>
        </div>
        <CopyBookingLinkButton publicSlug={current.business.publicSlug} />
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#16372f] text-white">
              <Settings2 className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Публична страница</p>
              <p className="mt-1 break-all text-sm text-[#69655e]">
                /b/{current.business.publicSlug}
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="justify-start border-[#d8d0c2] bg-white"
          >
            <Link href={`/b/${current.business.publicSlug}`} target="_blank">
              <ExternalLink className="size-4" />
              Виж публичната страница
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => (
          <Card key={card.href} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#16372f] ring-1 ring-[#ded7c8]">
                  <card.icon className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <Button
                asChild
                className="bg-[#16372f] text-white hover:bg-[#214b42]"
              >
                <Link href={card.href} target={card.external ? "_blank" : undefined}>
                  {card.action}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
