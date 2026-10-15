import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home, HelpCircle } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  helpDocSlug?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  children,
  helpDocSlug,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 pb-6 border-b border-[#425563]/40 animate-in fade-in duration-300">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="w-full">
          <ol className="flex items-center flex-wrap gap-1.5 text-xs font-semibold">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isFirst = index === 0;
              const content =
                crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="inline-flex items-center gap-1 text-[#ECEBE4]/70 hover:text-[#FFC72C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC72C] rounded px-1 py-0.5"
                  >
                    {isFirst && (
                      <Home
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>{crumb.label}</span>
                  </Link>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      isLast ? "text-[#FFC72C] font-bold" : "text-[#ECEBE4]/50"
                    }`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {isFirst && !crumb.href && (
                      <Home
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>{crumb.label}</span>
                  </span>
                );

              return (
                <li
                  key={`${crumb.label}-${index}`}
                  className="inline-flex items-center gap-1.5"
                >
                  {index > 0 && (
                    <ChevronRight
                      className="w-3 h-3 text-[#ECEBE4]/40 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {content}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide truncate">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
            {helpDocSlug && (
              <a
                href={`/docs/${helpDocSlug}`}
                target="_blank"
                rel="noreferrer"
                title="Ver documentación de ayuda"
                className="text-[#ECEBE4]/60 hover:text-[#FFC72C] transition-colors p-1 rounded-full hover:bg-[#425563]/30"
              >
                <HelpCircle className="w-5 h-5" />
              </a>
            )}
          </div>
          {description && (
            <div className="text-sm text-[#ECEBE4]/80 max-w-3xl leading-relaxed">
              {description}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
