"use client";

import { useEffect, useState } from "react";
import { dashboardService, type MetricCard as MetricCardType } from "@/services/dashboardService";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

type Range = "today" | "7d" | "30d";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

const METRIC_ICONS: Record<string, React.ReactNode> = {
  totalAmount: <BanknotesIcon className="w-6 h-6" />,
  successRate: <CheckBadgeIcon className="w-6 h-6" />,
  orderCount: <ShoppingCartIcon className="w-6 h-6" />,
  activeUsers: <UsersIcon className="w-6 h-6" />,
};

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("7d");
  const [metrics, setMetrics] = useState<MetricCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getMetrics(range)
      .then((res) => setMetrics(res.metrics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-8">
      {/* Header + Range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">仪表盘</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">实时监控交易数据和业务指标</p>
        </div>
        <div className="flex bg-[var(--gray-100)] rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === opt.value
                  ? "bg-white text-[var(--gray-900)] shadow-sm"
                  : "text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-6 animate-pulse">
              <div className="h-4 bg-[var(--gray-200)] rounded w-20 mb-4" />
              <div className="h-8 bg-[var(--gray-200)] rounded w-32 mb-2" />
              <div className="h-3 bg-[var(--gray-100)] rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      )}

      {/* Placeholder for orders section (Task-011) */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8 text-center text-[var(--gray-400)]">
        <ShoppingCartIcon className="w-10 h-10 mx-auto mb-3" />
        <p className="text-sm">订单列表即将上线</p>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricCardType }) {
  const isUp = metric.changeRate > 0;
  const isDown = metric.changeRate < 0;

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 hover:shadow-md transition-all cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--gray-500)]">{metric.label}</span>
        <div className="text-[var(--gray-400)]">
          {METRIC_ICONS[metric.key]}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-[var(--gray-900)]">
          {metric.key === "totalAmount" && "$"}{metric.value}
        </span>
        {metric.unit && metric.key !== "totalAmount" && (
          <span className="text-sm text-[var(--gray-500)] mb-0.5">{metric.unit}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {isUp && <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />}
        {isDown && <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />}
        <span className={`text-xs font-medium ${
          isUp ? "text-green-600" : isDown ? "text-red-500" : "text-[var(--gray-400)]"
        }`}>
          {isUp ? "+" : ""}{metric.changeRate}%
        </span>
        <span className="text-xs text-[var(--gray-400)]">较上期</span>
      </div>
    </div>
  );
}
