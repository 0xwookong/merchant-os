"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

// Shared label component with optional help hint
function Label({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-sm font-medium text-[var(--gray-700)]">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </span>
      {hint && (
        <span className="group relative">
          <InformationCircleIcon className="h-4 w-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] cursor-help shrink-0 mt-0.5" />
          <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-10 w-64 p-2.5 text-xs text-[var(--gray-700)] bg-white border border-[var(--gray-200)] rounded-lg shadow-lg leading-relaxed">
            {hint}
          </span>
        </span>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
}

export function Field({ label, value, onChange, placeholder, required, type = "text", hint }: FieldProps) {
  return (
    <label className="block">
      <Label label={label} required={required} hint={hint} />
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function Select({ label, value, onChange, options, placeholder, required, hint }: SelectProps) {
  return (
    <label className="block">
      <Label label={label} required={required} hint={hint} />
      <div className="relative mt-1">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-[var(--gray-300)] rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">{placeholder || "—"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </label>
  );
}

interface CheckboxGroupProps {
  label: string;
  value: string; // CSV
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
}

export function CheckboxGroup({ label, value, onChange, options, required, hint }: CheckboxGroupProps) {
  const selected = new Set((value || "").split(",").filter(Boolean));
  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange(Array.from(next).join(","));
  };
  return (
    <div>
      <Label label={label} required={required} hint={hint} />
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected.has(o.value)
                ? "bg-[var(--primary-black)] text-white border-[var(--primary-black)]"
                : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  hint?: string;
}

export function TextArea({ label, value, onChange, placeholder, required, rows = 4, hint }: TextAreaProps) {
  return (
    <label className="block">
      <Label label={label} required={required} hint={hint} />
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </label>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-[var(--gray-500)]">{label}</span>
      <p className="text-sm text-[var(--gray-900)] mt-0.5">{value || "—"}</p>
    </div>
  );
}

// Date picker with year/month/day dropdowns — much better for birth dates
interface DateSelectProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
  minYear?: number;
  maxYear?: number;
}

export function DateSelect({ label, value, onChange, required, hint, minYear = 1940, maxYear }: DateSelectProps) {
  const max = maxYear || new Date().getFullYear();
  const parts = (value || "").split("-");
  const y = parts[0] || "";
  const m = parts[1] || "";
  const d = parts[2] || "";

  const update = (year: string, month: string, day: string) => {
    if (year && month && day) onChange(`${year}-${month}-${day}`);
    else if (year || month || day) onChange(`${year}-${month}-${day}`);
    else onChange("");
  };

  const years = Array.from({ length: max - minYear + 1 }, (_, i) => String(max - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const daysInMonth = y && m ? new Date(Number(y), Number(m), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));

  const selectCls = "appearance-none border border-[var(--gray-300)] rounded-lg pl-3 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="block">
      <Label label={label} required={required} hint={hint} />
      <div className="mt-1 flex gap-2">
        <div className="relative">
          <select value={y} onChange={(e) => update(e.target.value, m, d)} className={`${selectCls} w-24`}>
            <option value="">----</option>
            {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
          </select>
          <DropdownArrow />
        </div>
        <div className="relative">
          <select value={m} onChange={(e) => update(y, e.target.value, d)} className={`${selectCls} w-20`}>
            <option value="">--</option>
            {months.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
          </select>
          <DropdownArrow />
        </div>
        <div className="relative">
          <select value={d} onChange={(e) => update(y, m, e.target.value)} className={`${selectCls} w-20`}>
            <option value="">--</option>
            {days.map((dy) => <option key={dy} value={dy}>{dy}</option>)}
          </select>
          <DropdownArrow />
        </div>
      </div>
    </div>
  );
}

function DropdownArrow() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}

const COUNTRY_CODES = [
  { code: "+852", label: "+852 (HK)" },
  { code: "+86", label: "+86 (CN)" },
  { code: "+1", label: "+1 (US)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+65", label: "+65 (SG)" },
  { code: "+81", label: "+81 (JP)" },
];

export function PhoneField({ label, value, onChange, required, hint }: PhoneFieldProps) {
  const parts = (value || "").split("-");
  const code = parts.length > 1 ? parts[0] : "+852";
  const number = parts.length > 1 ? parts.slice(1).join("-") : parts[0] || "";
  return (
    <label className="block">
      <Label label={label} required={required} hint={hint} />
      <div className="mt-1 flex gap-2">
        <div className="relative">
          <select
            value={code}
            onChange={(e) => onChange(`${e.target.value}-${number}`)}
            className="appearance-none w-36 border border-[var(--gray-300)] rounded-lg pl-3 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <input
          type="tel"
          value={number}
          onChange={(e) => onChange(`${code}-${e.target.value}`)}
          placeholder="12345678"
          className="flex-1 border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </label>
  );
}
