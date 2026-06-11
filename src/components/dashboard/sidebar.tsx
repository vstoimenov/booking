"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[#ded7c8] bg-[#fbfaf6] lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-[#ded7c8] px-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#16372f] text-sm font-semibold text-white">
            LO
          </span>
          <div>
            <p className="font-semibold">LocalOps</p>
            <p className="text-xs text-[#69655e]">Бизнес панел</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {dashboardNavigation.map((item) => {
            const isActive =
              "exact" in item && item.exact
                ? pathname === item.href
                : item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#575048]",
                  isActive && "bg-[#16372f] text-white",
                  !isActive && "hover:bg-[#eee7da]",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
