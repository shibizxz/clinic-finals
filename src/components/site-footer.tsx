import Link from "next/link";
import { getClinicSettings } from "@/lib/data";

export async function SiteFooter() {
  const clinic = await getClinicSettings();

  return (
    <footer className="border-t border-[var(--line)] bg-[rgba(255,252,247,0.88)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold text-[var(--ink)]">{clinic.name}</p>
          <p>{clinic.address}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/doctors" className="transition hover:text-[var(--brand)]">
            Browse doctors
          </Link>
          <Link href="/dashboard" className="transition hover:text-[var(--brand)]">
            Client dashboard
          </Link>
          <Link href="/admin" className="transition hover:text-[var(--brand)]">
            Admin console
          </Link>
        </div>
      </div>
    </footer>
  );
}
