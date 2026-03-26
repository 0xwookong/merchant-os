"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import type { TrendPoint } from "@/services/dashboardService";

interface Props {
  points: TrendPoint[];
  loading: boolean;
  t: (key: string) => string;
}

export default function TrendChart({ points, loading, t }: Props) {
  const maxAmount = useMemo(() => {
    if (!points.length) return 0;
    return Math.max(...points.map((p) => p.amount));
  }, [points]);

  const maxOrders = useMemo(() => {
    if (!points.length) return 0;
    return Math.max(...points.map((p) => p.orderCount));
  }, [points]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
        <div className="h-5 bg-[var(--gray-200)] rounded w-28 mb-6 animate-pulse" />
        <div className="h-[320px] bg-[var(--gray-50)] rounded animate-pulse" />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-6">{t("dashboard.trend.title")}</h2>
        <div className="h-[320px] flex items-center justify-center text-sm text-[var(--gray-400)]">
          {t("dashboard.trend.empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-6">{t("dashboard.trend.title")}</h2>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gray-900)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--gray-900)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: "var(--gray-500)" }}
              axisLine={{ stroke: "var(--gray-200)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="amount"
              orientation="left"
              tick={{ fontSize: 12, fill: "var(--gray-500)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              domain={[0, Math.ceil(maxAmount * 1.15)]}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 12, fill: "var(--gray-400)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(maxOrders * 1.3)]}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Area
              yAxisId="amount"
              type="monotone"
              dataKey="amount"
              stroke="var(--gray-900)"
              strokeWidth={2}
              fill="url(#amountGradient)"
              name={t("dashboard.trend.amount")}
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orderCount"
              stroke="var(--gray-400)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name={t("dashboard.trend.orderCount")}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[var(--gray-900)]" />
          <span className="text-xs text-[var(--gray-500)]">{t("dashboard.trend.amount")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t border-dashed border-[var(--gray-400)]" />
          <span className="text-xs text-[var(--gray-500)]">{t("dashboard.trend.orderCount")}</span>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, t }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; dataKey: string }>;
  label?: string;
  t: (key: string) => string;
}) {
  if (!active || !payload?.length) return null;

  const amount = payload.find((p) => p.dataKey === "amount");
  const orders = payload.find((p) => p.dataKey === "orderCount");

  return (
    <div className="bg-white rounded-lg shadow-lg border border-[var(--gray-200)] px-4 py-3 text-sm">
      <p className="text-[var(--gray-500)] font-medium mb-2">{label}</p>
      {amount && (
        <p className="text-[var(--gray-900)]">
          {t("dashboard.trend.amount")}: <span className="font-semibold">${amount.value.toLocaleString()}</span>
        </p>
      )}
      {orders && (
        <p className="text-[var(--gray-600)] mt-1">
          {t("dashboard.trend.orderCount")}: <span className="font-semibold">{orders.value}</span>
        </p>
      )}
    </div>
  );
}
