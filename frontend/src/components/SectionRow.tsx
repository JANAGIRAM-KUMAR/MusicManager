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
      <div className="mb-3 flex items-end justify-between px-1 sm:px-2">
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        {href && (
          <Link
            to={href}
            className="text-xs font-semibold text-zinc-400 uppercase tracking-wider transition hover:text-white"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-3 pt-1 px-1 sm:px-0 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
};
