import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  MessageSquareHeart,
  UsersRound,
} from "lucide-react";

import { DemoDataButton } from "@/components/demo-data/demo-data-button";
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

function DemoDataError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим демо данните</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function DemoDataPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/demo-data");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <DemoDataError message={current.message} />;
  }

  const demoItems = [
    {
      title: "Услуги",
      description: "Три активни услуги с цени, описания и продължителност.",
      icon: ClipboardList,
    },
    {
      title: "Клиенти и заявки",
      description:
        "Клиенти от Instagram, TikTok, Facebook, Google и публичната страница.",
      icon: UsersRound,
    },
    {
      title: "Часове",
      description:
        "Предстоящи, потвърдени, завършени, отказани и no-show часове.",
      icon: CalendarCheck,
    },
    {
      title: "Отзиви и анализи",
      description:
        "Примерни заявки за отзив и събития, за да оживеят графиките.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Демо данни
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Добави примерни записи, за да покажеш продукта като работещ салон с
            реален pipeline, часове, клиенти, отзиви и анализи.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-[#d8d0c2] bg-white"
        >
          <Link href="/dashboard">Назад към таблото</Link>
        </Button>
      </div>

      <Card className="border-[#dfc8a2] bg-[#fff8e8]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#8a5a20] ring-1 ring-[#ead2a9]">
            <AlertTriangle className="size-5" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">
                Това ще добави примерни данни към текущия бизнес.
              </p>
              <p className="mt-1 text-sm leading-6 text-[#72521f]">
                Данните се създават само за този бизнес и няма да засегнат други
                акаунти. Ако вече са добавени, системата няма да ги дублира.
              </p>
            </div>
            <DemoDataButton />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {demoItems.map((item) => (
          <Card key={item.title} className="border-[#ded7c8] bg-[#fbfaf6]">
            <CardHeader className="border-b border-[#ece4d7]">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#16372f] ring-1 ring-[#ded7c8]">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareHeart className="size-5 text-[#a84b32]" />
            Какво да покажеш след това
          </CardTitle>
          <CardDescription>
            След добавяне на данните отвори таблото, Lead CRM, часовете,
            клиентите, отзивите и анализите.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
            <Link href="/dashboard">Преглед</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
            <Link href="/dashboard/leads">Запитвания</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
            <Link href="/dashboard/appointments">Часове</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
            <Link href="/dashboard/reviews">Отзиви</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#d8d0c2] bg-white">
            <Link href="/dashboard/analytics">Анализи</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
