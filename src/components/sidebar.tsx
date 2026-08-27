"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/b2c-funnel", label: "B2C Funnel" },
  { href: "/b2b-pipeline", label: "B2B Pipeline" },
  { href: "/clients", label: "Clients" },
  { href: "/financials", label: "Financials" },
  { href: "/growth-calculator", label: "Growth Calculator" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface/60 px-4 py-6">
      <div className="mb-8 px-2">
        <Logo className="h-9 w-auto" />
        <p className="mt-2 text-xs text-muted">Business Dashboard</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-3 text-[15px] font-medium transition-colors ${
                active
                  ? "bg-surface-hover text-foreground border-l-[3px] border-accent -ml-px pl-[13px]"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4 px-2">
        <ThemeToggle />
        <p className="mt-3 text-[11px] text-muted">Private instance — data not shared.</p>
      </div>
    </aside>
  );
}
