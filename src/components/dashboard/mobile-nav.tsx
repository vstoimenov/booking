"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dashboardNavigation } from "@/lib/constants/navigation";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Отвори навигацията</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#fbfaf6]">
        <SheetHeader>
          <SheetTitle>LocalOps</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {dashboardNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#575048] hover:bg-[#eee7da]"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
