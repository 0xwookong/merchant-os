"use client";

import { useEffect, useState, useCallback } from "react";
import { dashboardService, type MetricCard as MetricCardType } from "@/services/dashboardService";
import { orderService, type OrderListItem } from "@/services/orderService";
import OrderDetailDialog from "@/components/dashboard/order-detail-dialog";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

  // Orders state
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPayment, setOrderPayment] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    dashboardService.getMetrics(range)
      .then((res) => setMetrics(res.metrics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  const fetchOrders = useCallback(() => {
    setOrdersLoading(true);
    orderService.list({
      status: orderStatus || undefined,
      paymentMethod: orderPayment || undefined,
      page: String(orderPage),
      pageSize: "10",
    })
      .then((res) => { setOrders(res.list); setOrderTotal(res.total); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [orderStatus, orderPayment, orderPage]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleExportCsv = () => {
    const headers = ["订单号", "金额", "币种", "加密货币", "网络", "支付方式", "状态", "时间"];
    const rows = orders.map((o) => [
      o.orderNo, o.fiatAmount, o.fiatCurrency,
      o.cryptoAmount ? `${o.cryptoAmount} ${o.cryptoCurrency}` : "",
      o.cryptoNetwork || "", o.paymentMethod, o.status,
      new Date(o.createdAt).toLocaleString("zh-CN"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Orders section */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        {/* Filters */}
        <div className="p-6 border-b border-[var(--gray-100)] flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">订单列表</h2>
          <div className="flex gap-3 items-center">
            <button onClick={handleExportCsv} disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-30 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />导出 CSV
            </button>
            <select value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setOrderPage(1); }}
              className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]">
              <option value="">全部状态</option>
              <option value="CREATED">已创建</option>
              <option value="PROCESSING">处理中</option>
              <option value="SUCCESSED">支付成功</option>
              <option value="COMPLETED">已完成</option>
              <option value="FAILED">失败</option>
            </select>
            <select value={orderPayment} onChange={(e) => { setOrderPayment(e.target.value); setOrderPage(1); }}
              className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]">
              <option value="">全部方式</option>
              <option value="CARD">银行卡</option>
              <option value="GOOGLEPAY">Google Pay</option>
              <option value="APPLEPAY">Apple Pay</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {ordersLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[var(--gray-400)]">
            <ShoppingCartIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">暂无订单数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--gray-100)]">
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">订单号</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">金额</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">加密货币</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">支付方式</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">状态</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)] cursor-pointer transition-colors">
                    <td className="py-4 px-6 font-mono text-[var(--gray-900)]">{order.orderNo}</td>
                    <td className="py-4 px-6 text-[var(--gray-700)]">${order.fiatAmount} {order.fiatCurrency}</td>
                    <td className="py-4 px-6 text-[var(--gray-700)]">
                      {order.cryptoAmount ? (
                        <div>
                          <span>{order.cryptoAmount} {order.cryptoCurrency}</span>
                          {order.cryptoNetwork && <span className="ml-1 text-xs text-[var(--gray-400)]">({order.cryptoNetwork})</span>}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="py-4 px-6"><PaymentBadge method={order.paymentMethod} /></td>
                    <td className="py-4 px-6"><StatusBadge status={order.status} /></td>
                    <td className="py-4 px-6 text-[var(--gray-500)]">{new Date(order.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {orderTotal > 0 && (
          <div className="p-4 border-t border-[var(--gray-100)] flex items-center justify-between text-sm">
            <span className="text-[var(--gray-500)]">共 {orderTotal} 条</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setOrderPage(Math.max(1, orderPage - 1))} disabled={orderPage <= 1}
                className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-[var(--gray-700)]">第 {orderPage} 页</span>
              <button onClick={() => setOrderPage(orderPage + 1)} disabled={orderPage * 10 >= orderTotal}
                className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
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

const STATUS_STYLES: Record<string, string> = {
  CREATED: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  PROCESSING: "bg-blue-50 text-blue-700",
  SUCCESSED: "bg-yellow-50 text-yellow-700",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  CREATED: "已创建", PROCESSING: "处理中", SUCCESSED: "支付成功", COMPLETED: "已完成", FAILED: "失败",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] || ""}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const labels: Record<string, string> = { CARD: "银行卡", GOOGLEPAY: "Google Pay", APPLEPAY: "Apple Pay" };
  return <span className="text-[var(--gray-700)]">{labels[method] || method}</span>;
}
