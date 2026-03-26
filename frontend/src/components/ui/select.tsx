"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";

const CHEVRON_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E";

const BASE_CLASS =
  "appearance-none border border-[var(--gray-300)] rounded-lg pl-3 pr-9 py-2 text-sm text-[var(--gray-700)] bg-white bg-no-repeat focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", selectSize = "md", style, ...props }, ref) => {
    const sizeClass = selectSize === "sm" ? "py-1.5 text-xs" : "py-2 text-sm";
    return (
      <select
        ref={ref}
        className={`${BASE_CLASS} ${sizeClass} ${className}`}
        style={{
          backgroundImage: `url("${CHEVRON_SVG}")`,
          backgroundSize: "20px",
          backgroundPosition: "right 10px center",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Select.displayName = "Select";
