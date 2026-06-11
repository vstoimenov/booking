import {
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquareHeart,
  Palette,
  Settings,
  Share2,
  Store,
  UsersRound,
} from "lucide-react";

export const dashboardNavigation = [
  { label: "Преглед", href: "/dashboard", icon: LayoutDashboard },
  { label: "Клиенти", href: "/dashboard/clients", icon: BriefcaseBusiness },
  { label: "Услуги", href: "/dashboard/services", icon: ClipboardList },
  { label: "Запитвания", href: "/dashboard/leads", icon: UsersRound },
  { label: "Часове", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "Автоматизации", href: "/dashboard/automations", icon: BellRing },
  { label: "Отзиви", href: "/dashboard/reviews", icon: MessageSquareHeart },
  { label: "Анализи", href: "/dashboard/analytics", icon: BarChart3 },
  {
    label: "Социални линкове",
    href: "/dashboard/settings/social-links",
    icon: Share2,
  },
  { label: "Профил", href: "/dashboard/settings/profile", icon: Store },
  { label: "Брандинг", href: "/dashboard/settings/branding", icon: Palette },
  { label: "Настройки", href: "/dashboard/settings", icon: Settings, exact: true },
] as const;
