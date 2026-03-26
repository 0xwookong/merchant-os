"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PaymentMethodItem } from "@/services/dashboardService";

interface Props {
  methods: PaymentMethodItem[];
  loading: boolean;
  t: (key: string) => string;
}

const COLORS: Record<string, string> = {
  CARD: "#1f2937",       // gray-900
  GOOGLEPAY: "#9ca3af",  // gray-400
  APPLEPAY: "#e5e7eb",   // gray-200
};

export default function PaymentMethodDistribution({ methods, loading, t }: Props) {
  const totalAmount = useMemo(
    () => methods.reduce((sum, m) => sum + m.amount, 0),
    [methods]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
        <div className="h-5 bg-[var(--gray-200)] rounded w-36 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-[var(--gray-100)] animate-pulse" />
          </div>
          <div className="md:col-span-3 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-[var(--gray-100)] rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!methods.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-6">{t("dashboard.paymentMethods.title")}</h2>
        <div className="h-48 flex items-center justify-center text-sm text-[var(--gray-400)]">
          {t("dashboard.paymentMethods.empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-6">{t("dashboard.paymentMethods.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Donut Chart */}
        <div className="md:col-span-2 flex items-center justify-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methods}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {methods.map((entry) => (
                    <Cell key={entry.method} fill={COLORS[entry.method] || "#d1d5db"} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-[var(--gray-400)]">{t("dashboard.paymentMethods.total")}</span>
              <span className="text-lg font-semibold text-[var(--gray-900)]">
                ${totalAmount >= 1000 ? `${(totalAmount / 1000).toFixed(1)}k` : totalAmount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Table */}
        <div className="md:col-span-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left text-xs font-semibold text-[var(--gray-500)] pb-3">{t("dashboard.paymentMethods.method")}</th>
                <th className="text-right text-xs font-semibold text-[var(--gray-500)] pb-3">{t("dashboard.paymentMethods.amount")}</th>
                <th className="text-right text-xs font-semibold text-[var(--gray-500)] pb-3">{t("dashboard.paymentMethods.percentage")}</th>
                <th className="text-right text-xs font-semibold text-[var(--gray-500)] pb-3">{t("dashboard.paymentMethods.orderCount")}</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.method} className="border-b border-[var(--gray-50)]">
                  <td className="py-3 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: COLORS[m.method] || "#d1d5db" }}
                    />
                    <span className="text-sm text-[var(--gray-900)]">{m.label}</span>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-[var(--gray-900)]">
                    ${m.amount.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-sm text-[var(--gray-600)]">
                    {m.percentage.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right text-sm text-[var(--gray-600)]">
                    {m.orderCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PaymentMethodItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-[var(--gray-200)] px-3 py-2 text-sm">
      <p className="font-medium text-[var(--gray-900)]">{item.label}</p>
      <p className="text-[var(--gray-600)]">${item.amount.toLocaleString()} · {item.percentage.toFixed(1)}%</p>
    </div>
  );
}
