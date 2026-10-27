import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface SectionRowProps {
  title: string;
  href?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
}

export const SectionRow = ({
  title,
  href,
  actionLabel = "Show all",
  children,
  className,
}: SectionRowProps) => {
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        {href && (
          <Link
            to={href}
            className="text-xs font-semibold text-zinc-400 uppercase tracking-wide transition hover:text-white"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {children}
      </div>
    </section>
  );
};
