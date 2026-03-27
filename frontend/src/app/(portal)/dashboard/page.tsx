"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  dashboardService,
  type MetricCard as MetricCardType,
  type TrendPoint,
  type PaymentMethodItem,
} from "@/services/dashboardService";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import TrendChart from "./_components/trend-chart";
import PaymentMethodDistribution from "./_components/payment-method-distribution";

type Range = "today" | "7d" | "30d";

const METRIC_ICONS: Record<string, React.ReactNode> = {
  totalAmount: <BanknotesIcon className="w-6 h-6" />,
  successRate: <CheckBadgeIcon className="w-6 h-6" />,
  orderCount: <ShoppingCartIcon className="w-6 h-6" />,
  activeUsers: <UsersIcon className="w-6 h-6" />,
};

export default function DashboardPage() {
  const { t } = useI18n();
  const { environment, isSandbox } = useEnvironment();
  const { applicationStatus } = useApplicationStatus();
  const [range, setRange] = useState<Range>("7d");
  const [metrics, setMetrics] = useState<MetricCardType[]>([]);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isApproved = applicationStatus === "APPROVED";
  const showNotApproved = !isSandbox && !isApproved;

  const RANGE_OPTIONS: { value: Range; label: string }[] = [
    { value: "today", label: t("dashboard.range.today") },
    { value: "7d", label: t("dashboard.range.7d") },
    { value: "30d", label: t("dashboard.range.30d") },
  ];

  const fetchData = useCallback((r: string) => {
    if (showNotApproved) return;
    setLoading(true);
    Promise.all([
      dashboardService.getMetrics(r),
      dashboardService.getTrend(r),
      dashboardService.getPaymentMethods(r),
    ])
      .then(([metricsRes, trendRes, pmRes]) => {
        setMetrics(metricsRes.metrics);
        setTrendPoints(trendRes.points);
        setPaymentMethods(pmRes.methods);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [showNotApproved, environment]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  if (showNotApproved) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("dashboard.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm py-20 text-center">
          <RocketLaunchIcon className="w-10 h-10 mx-auto mb-3 text-[var(--gray-300)]" />
          <p className="text-sm font-medium text-[var(--gray-700)]">{t("dashboard.notApproved")}</p>
          <p className="text-xs text-[var(--gray-400)] mt-1 max-w-sm mx-auto">{t("dashboard.notApprovedHint")}</p>
          <Link href="/organization/application"
            className="inline-block mt-4 px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            {t("dashboard.goOnboarding")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header + Range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("dashboard.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("dashboard.subtitle")}</p>
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
            <MetricCardComponent key={metric.key} metric={metric} t={t} />
          ))}
        </div>
      )}

      {/* Trend Chart */}
      <TrendChart points={trendPoints} loading={loading} t={t} />

      {/* Payment Method Distribution */}
      <PaymentMethodDistribution methods={paymentMethods} loading={loading} t={t} />
    </div>
  );
}

function MetricCardComponent({ metric, t }: { metric: MetricCardType; t: (key: string) => string }) {
  const isUp = metric.changeRate > 0;
  const isDown = metric.changeRate < 0;

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 hover:shadow-md transition-all cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--gray-500)]">{t(`dashboard.metric.${metric.key}`)}</span>
        <div className="text-[var(--gray-400)]">
          {METRIC_ICONS[metric.key]}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-[var(--gray-900)]">
          {metric.key === "totalAmount" && "$"}{metric.value}
        </span>
        {metric.unit && metric.key !== "totalAmount" && (
          <span className="text-sm text-[var(--gray-500)] mb-0.5">{t(`dashboard.metric.unit.${metric.key}`)}</span>
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
        <span className="text-xs text-[var(--gray-400)]">{t("dashboard.vsPrior")}</span>
      </div>
    </div>
  );
}
