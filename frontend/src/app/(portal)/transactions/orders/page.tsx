"use client";

import { useEffect, useState, useCallback } from "react";
import { orderService, type OrderListItem } from "@/services/orderService";
import { useI18n } from "@/providers/language-provider";
import OrderDetailDialog from "@/components/dashboard/order-detail-dialog";
import {
  ShoppingCartIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderService.list({
      status: status || undefined,
      paymentMethod: payment || undefined,
      page: String(page),
      pageSize: "10",
    })
      .then((res) => { setOrders(res.list); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, payment, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleExportCsv = () => {
    const headers = [
      t("orders.col.orderNo"), t("orders.col.amount"), t("orders.col.currency"),
      t("orders.col.crypto"), t("orders.col.network"), t("orders.col.payment"),
      t("orders.col.status"), t("orders.col.time"),
    ];
    const rows = orders.map((o) => [
      o.orderNo, o.fiatAmount, o.fiatCurrency,
      o.cryptoAmount ? `${o.cryptoAmount} ${o.cryptoCurrency}` : "",
      o.cryptoNetwork || "", o.paymentMethod, o.status,
      new Date(o.createdAt).toLocaleString(),
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
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("orders.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("orders.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        {/* Filters */}
        <div className="p-6 border-b border-[var(--gray-100)] flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("orders.list")}</h2>
          <div className="flex gap-3 items-center">
            <button onClick={handleExportCsv} disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-30 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />{t("orders.export")}
            </button>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]">
              <option value="">{t("orders.filter.allStatus")}</option>
              <option value="CREATED">{t("orders.status.CREATED")}</option>
              <option value="PROCESSING">{t("orders.status.PROCESSING")}</option>
              <option value="SUCCESSED">{t("orders.status.SUCCESSED")}</option>
              <option value="COMPLETED">{t("orders.status.COMPLETED")}</option>
              <option value="FAILED">{t("orders.status.FAILED")}</option>
            </select>
            <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}
              className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]">
              <option value="">{t("orders.filter.allPayment")}</option>
              <option value="CARD">{t("orders.payment.CARD")}</option>
              <option value="GOOGLEPAY">{t("orders.payment.GOOGLEPAY")}</option>
              <option value="APPLEPAY">{t("orders.payment.APPLEPAY")}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[var(--gray-400)]">
            <ShoppingCartIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{t("orders.empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--gray-100)]">
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.orderNo")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.amount")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.crypto")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.payment")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.status")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">{t("orders.col.time")}</th>
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
                    <td className="py-4 px-6"><PaymentBadge method={order.paymentMethod} t={t} /></td>
                    <td className="py-4 px-6"><StatusBadge status={order.status} t={t} /></td>
                    <td className="py-4 px-6 text-[var(--gray-500)]">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="p-4 border-t border-[var(--gray-100)] flex items-center justify-between text-sm">
            <span className="text-[var(--gray-500)]">{t("orders.total", { count: total })}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-[var(--gray-700)]">{t("orders.page", { page })}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 10 >= total}
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

const STATUS_STYLES: Record<string, string> = {
  CREATED: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  PROCESSING: "bg-blue-50 text-blue-700",
  SUCCESSED: "bg-yellow-50 text-yellow-700",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] || ""}`}>
      {t(`orders.status.${status}`) || status}
    </span>
  );
}

function PaymentBadge({ method, t }: { method: string; t: (key: string) => string }) {
  return <span className="text-[var(--gray-700)]">{t(`orders.payment.${method}`) || method}</span>;
}
