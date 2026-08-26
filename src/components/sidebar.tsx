"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/b2c-funnel", label: "B2C Funnel" },
  { href: "/b2b-pipeline", label: "B2B Pipeline" },
  { href: "/financials", label: "Financials" },
  { href: "/growth-calculator", label: "Growth Calculator" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-4 py-6">
      <div className="mb-8 px-2">
        <Image
          src="/revena-logo.png"
          alt="Revena Media"
          width={1398}
          height={600}
          priority
          className="h-9 w-auto"
        />
        <p className="mt-2 text-xs text-muted">CAC / LTV Dashboard</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface-hover text-foreground border-l-2 border-accent -ml-px pl-[11px]"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4 px-2">
        <p className="text-[11px] text-muted">Private instance — data not shared.</p>
      </div>
    </aside>
  );
}
