import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  ExternalLink,
  MessageSquareHeart,
  Star,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  appointmentStatusLabels,
  formatAppointmentRange,
  isAppointmentStatus,
  relationValue,
} from "@/lib/appointments/format";
import { getCurrentUserBusiness } from "@/lib/business/current";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ReviewStatus =
  | "requested"
  | "opened"
  | "submitted"
  | "published"
  | "declined";

type ReviewRow = {
  id: string;
  status: ReviewStatus;
  rating: number | null;
  review_url: string | null;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  appointment: {
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    service: {
      name: string;
    } | null;
  } | null;
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  requested: "Изпратена заявка",
  opened: "Отворена",
  submitted: "Получен отзив",
  published: "Публикуван",
  declined: "Отказан",
};

const reviewStatusBadgeClassNames: Record<ReviewStatus, string> = {
  requested: "border-[#c6d9ef] bg-[#edf5ff] text-[#28577f]",
  opened: "border-[#dfc8a2] bg-[#fff6e6] text-[#7a4f12]",
  submitted: "border-[#c5dec9] bg-[#eff8f0] text-[#25613a]",
  published: "border-[#b9d8c5] bg-[#edf8f0] text-[#245d36]",
  declined: "border-[#efc3b5] bg-[#fff2ee] text-[#9d321d]",
};

function isReviewStatus(value: string): value is ReviewStatus {
  return [
    "requested",
    "opened",
    "submitted",
    "published",
    "declined",
  ].includes(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge
      variant="outline"
      className={reviewStatusBadgeClassNames[status] ?? "border-[#d8d0c2]"}
    >
      {reviewStatusLabels[status]}
    </Badge>
  );
}

function ReviewsError({ message }: { message: string }) {
  return (
    <Card className="border-[#efb3a5] bg-[#fff7f4]">
      <CardHeader>
        <CardTitle>Не успяхме да заредим отзивите</CardTitle>
        <CardDescription className="text-[#8f3a25]">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function ReviewsPage() {
  const current = await getCurrentUserBusiness();

  if (!current.ok) {
    if (current.reason === "unauthenticated") {
      redirect("/login?next=/dashboard/reviews");
    }

    if (current.reason === "missing_business") {
      redirect("/onboarding");
    }

    return <ReviewsError message={current.message} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, status, rating, review_url, requested_at, responded_at, created_at, customer:customers(id, full_name, phone, email), appointment:appointments(id, starts_at, ends_at, status, service:services(name))",
    )
    .eq("business_id", current.business.id)
    .order("requested_at", { ascending: false })
    .limit(100);

  if (error) {
    return <ReviewsError message={error.message} />;
  }

  const reviews = ((data ?? []) as Array<
    Omit<ReviewRow, "customer" | "appointment"> & {
      customer?: ReviewRow["customer"] | ReviewRow["customer"][];
      appointment?:
        | (Omit<NonNullable<ReviewRow["appointment"]>, "service"> & {
            service?:
              | NonNullable<ReviewRow["appointment"]>["service"]
              | NonNullable<ReviewRow["appointment"]>["service"][];
          })
        | Array<
            Omit<NonNullable<ReviewRow["appointment"]>, "service"> & {
              service?:
                | NonNullable<ReviewRow["appointment"]>["service"]
                | NonNullable<ReviewRow["appointment"]>["service"][];
            }
          >;
    }
  >).map((review) => {
    const appointment = relationValue(review.appointment);

    return {
      ...review,
      status: isReviewStatus(review.status) ? review.status : "requested",
      customer: relationValue(review.customer),
      appointment: appointment
        ? {
            ...appointment,
            service: relationValue(appointment.service),
          }
        : null,
    };
  });

  const requestedCount = reviews.filter(
    (review) => review.status === "requested" || review.status === "opened",
  ).length;
  const submittedCount = reviews.filter(
    (review) => review.status === "submitted" || review.status === "published",
  ).length;
  const averageRating =
    reviews.filter((review) => review.rating).length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
        reviews.filter((review) => review.rating).length
      : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 border-[#b9d8c5] bg-[#edf8f0] text-[#245d36] hover:bg-[#edf8f0]">
            {current.business.name}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Отзиви
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69655e] sm:text-base">
            Следи заявките за отзиви след завършени часове и виж кои клиенти
            вече са оставили обратна връзка.
          </p>
        </div>
        <Button asChild className="bg-[#16372f] text-white hover:bg-[#214b42]">
          <Link href="/dashboard/appointments?status=completed&date=all">
            <CalendarCheck className="size-4" />
            Завършени часове
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#69655e]">
              Заявки за отзив
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{requestedCount}</div>
            <p className="mt-1 text-sm text-[#69655e]">чакат реакция</p>
          </CardContent>
        </Card>
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#69655e]">
              Получени отзиви
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{submittedCount}</div>
            <p className="mt-1 text-sm text-[#69655e]">
              submitted или published
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#ded7c8] bg-[#fbfaf6]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#69655e]">
              Средна оценка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-3xl font-semibold">
              {averageRating ? averageRating.toFixed(1) : "-"}
              <Star className="size-5 fill-[#a84b32] text-[#a84b32]" />
            </div>
            <p className="mt-1 text-sm text-[#69655e]">от наличните оценки</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#ded7c8] bg-[#fbfaf6]">
        <CardHeader className="border-b border-[#ece4d7]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Заявки за отзиви</CardTitle>
              <CardDescription>
                {reviews.length === 1
                  ? "1 заявка за отзив"
                  : `${reviews.length} заявки за отзив`}
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#d8d0c2] bg-white sm:w-auto"
            >
              <Link href="/dashboard/automations">
                Шаблони за отзиви
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d6cbbb] bg-white px-4 py-12 text-center">
              <MessageSquareHeart className="mx-auto size-10 text-[#a84b32]" />
              <h2 className="mt-4 text-xl font-semibold">
                Все още няма заявки за отзиви.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69655e]">
                Когато имате завършен час, копирайте review шаблона от
                автоматизациите и следете резултата тук.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  asChild
                  className="bg-[#16372f] text-white hover:bg-[#214b42]"
                >
                  <Link href="/dashboard/appointments?status=completed&date=all">
                    Виж завършените часове
                  </Link>
                </Button>
                <DemoDataButton className="border border-[#d8d0c2] bg-white text-[#16372f] hover:bg-[#f1ebe0]" />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2dbcf]">
                    <TableHead>Клиент</TableHead>
                    <TableHead>Час</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Заявена</TableHead>
                    <TableHead>Отговор</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="border-[#e8e0d4]">
                      <TableCell className="min-w-52 whitespace-normal">
                        <div className="font-medium">
                          {review.customer?.full_name ?? "Клиент без име"}
                        </div>
                        <div className="text-xs leading-5 text-[#69655e]">
                          {review.customer?.phone ??
                            review.customer?.email ??
                            "Няма контакт"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-56 whitespace-normal text-[#575048]">
                        {review.appointment ? (
                          <div>
                            <div>
                              {formatAppointmentRange(
                                review.appointment.starts_at,
                                review.appointment.ends_at,
                              )}
                            </div>
                            <div className="text-xs text-[#69655e]">
                              {review.appointment.service?.name ?? "Без услуга"} ·{" "}
                              {isAppointmentStatus(review.appointment.status)
                                ? appointmentStatusLabels[
                                    review.appointment.status
                                  ]
                                : review.appointment.status}
                            </div>
                          </div>
                        ) : (
                          "Няма свързан час"
                        )}
                      </TableCell>
                      <TableCell>
                        <ReviewStatusBadge status={review.status} />
                      </TableCell>
                      <TableCell>
                        {review.rating ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            {review.rating}
                            <Star className="size-4 fill-[#a84b32] text-[#a84b32]" />
                          </span>
                        ) : (
                          <span className="text-[#69655e]">Няма</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-40 text-[#69655e]">
                        {formatDateTime(review.requested_at)}
                      </TableCell>
                      <TableCell className="min-w-40 text-[#69655e]">
                        {review.responded_at
                          ? formatDateTime(review.responded_at)
                          : "Чака се"}
                      </TableCell>
                      <TableCell className="min-w-56 text-right">
                        <div className="flex flex-col justify-end gap-2 sm:flex-row">
                          {review.appointment ? (
                            <Button
                              asChild
                              variant="outline"
                              className="border-[#d8d0c2] bg-white"
                            >
                              <Link
                                href={`/dashboard/appointments/${review.appointment.id}`}
                              >
                                Час
                              </Link>
                            </Button>
                          ) : null}
                          {review.review_url ? (
                            <Button
                              asChild
                              variant="outline"
                              className="border-[#d8d0c2] bg-white"
                            >
                              <Link href={review.review_url} target="_blank">
                                <ExternalLink className="size-4" />
                                Отвори
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
