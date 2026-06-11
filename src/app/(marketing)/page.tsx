import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const verticals = ["Красота", "Дентални услуги", "Почистване"];

const proofItems = [
  "Страница за резервации",
  "CRM за запитвания",
  "Напомняния",
  "Заявки за отзиви",
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#161616]">
      <section className="relative overflow-hidden border-b border-[#ded7c8]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,55,47,0.08)_1px,transparent_1px),linear-gradient(rgba(22,55,47,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[#f5f1e8]" />
        <div className="relative mx-auto min-h-[92vh] w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-md bg-[#16372f] text-sm text-white">
                LO
              </span>
              LocalOps White Label
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Вход</Link>
              </Button>
              <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
                <Link href="/register">Започни MVP</Link>
              </Button>
            </div>
          </nav>

          <div className="grid min-h-[calc(92vh-76px)] items-center gap-10 py-10 lg:grid-cols-[0.94fr_1.06fr] lg:py-12">
            <div className="max-w-2xl">
              <Badge className="mb-6 border-[#c8573f]/20 bg-[#fff4ef] text-[#9d432f] hover:bg-[#fff4ef]">
                Създадено за салони и локални услуги
              </Badge>
              <h1 className="text-5xl font-semibold leading-[1.02] text-[#151515] sm:text-6xl lg:text-7xl">
                Пусни резервации и CRM за своя салон за един ден.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#575048]">
                Салони, студиа и локални услуги могат да приемат запитвания,
                да следят клиенти, да напомнят за часове и да искат отзиви от
                едно табло.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#16372f] text-white hover:bg-[#214b42]"
                >
                  <Link href="/register">
                    Регистрирай бизнеса <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#bcb3a0] bg-white/70"
                >
                  <Link href="/login">Вход за бизнес</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap gap-2">
                {verticals.map((vertical) => (
                  <span
                    key={vertical}
                    className="rounded-md border border-[#d8cfbf] bg-white/70 px-3 py-2 text-sm text-[#575048]"
                  >
                    {vertical}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[540px] lg:min-h-[620px]">
              <div className="absolute left-0 top-8 w-[92%] rounded-lg border border-[#d8cfbf] bg-[#fbfaf6] p-4 shadow-2xl shadow-[#16372f]/10 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-[#e6dfd3] pb-4">
                  <div>
                    <p className="text-sm font-medium text-[#7d3f2e]">
                      Glow Studio
                    </p>
                    <p className="text-2xl font-semibold text-[#161616]">
                      Фуния за днес
                    </p>
                  </div>
                  <div className="rounded-md bg-[#16372f] px-3 py-2 text-sm font-medium text-white">
                    12 нови запитвания
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {["Нови", "Запазени", "Отзив"].map((stage, index) => (
                    <div
                      key={stage}
                      className="rounded-md border border-[#e2dbcf] bg-white p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">{stage}</p>
                        <span className="text-xs text-[#69655e]">
                          {index + 3}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-14 rounded-md bg-[#edf8f0]" />
                        <div className="h-14 rounded-md bg-[#f8ebe5]" />
                        <div className="h-14 rounded-md bg-[#eef3f1]" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-[#e2dbcf] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="size-5 text-[#28705d]" />
                      <p className="font-medium">Следващ час</p>
                    </div>
                    <p className="mt-3 text-3xl font-semibold">14:30</p>
                    <p className="mt-1 text-sm text-[#69655e]">
                      Лазерна консултация, потвърдена
                    </p>
                  </div>
                  <div className="rounded-md border border-[#e2dbcf] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Star className="size-5 text-[#b56a1d]" />
                      <p className="font-medium">Заявки за отзив</p>
                    </div>
                    <p className="mt-3 text-3xl font-semibold">38</p>
                    <p className="mt-1 text-sm text-[#69655e]">
                      Изпратени този месец
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 right-0 w-[78%] rounded-lg border border-[#d8cfbf] bg-white p-4 shadow-xl shadow-[#16372f]/10 sm:w-[62%]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-[#f8ebe5]">
                    <MessageSquareText className="size-5 text-[#a84b32]" />
                  </span>
                  <div>
                    <p className="font-medium">Напомнянето е подготвено</p>
                    <p className="text-sm text-[#69655e]">
                      Изпратено от бранда на агенцията
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        {proofItems.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-[#28705d]" />
            <span className="font-medium">{item}</span>
          </div>
        ))}
      </section>

      <section className="border-y border-[#ded7c8] bg-[#fbfaf6]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: ClipboardList,
              title: "Бърз старт за салона",
              body: "Създай бизнес профил, услуги и публична страница за резервации без сложен конструктор.",
            },
            {
              icon: Sparkles,
              title: "Под твоя бранд",
              body: "Името, цветът и логото на бизнеса стоят в работната среда и процеса на резервация.",
            },
            {
              icon: MessageSquareText,
              title: "Последваща комуникация",
              body: "Превърни пропуснатите запитвания в запазени часове и заявки за отзив.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[#ded7c8] bg-white p-6"
            >
              <feature.icon className="size-6 text-[#a84b32]" />
              <h2 className="mt-5 text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-[#625c55]">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
