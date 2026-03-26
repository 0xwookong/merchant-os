"use client";

import { useEffect, useState, useCallback } from "react";
import { orderService, type OrderListItem } from "@/services/orderService";
import { useI18n } from "@/providers/language-provider";
import OrderDetailDialog from "@/components/dashboard/order-detail-dialog";
import {
  InboxIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SELECT_CLASS = "border border-[var(--gray-300)] rounded-lg pl-3 pr-8 py-2 text-sm text-[var(--gray-700)] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat";

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Date range limits: max 30 days back from today
  const today = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderService.list({
      status: status || undefined,
      paymentMethod: payment || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: String(page),
      pageSize: String(pageSize),
    })
      .then((res) => { setOrders(res.list); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, payment, startDate, endDate, page, pageSize]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // CSV export — exports current page only; bulk export requires separate request
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
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("orders.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("orders.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-3 items-center flex-wrap">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className={SELECT_CLASS}>
              <option value="">{t("orders.filter.allStatus")}</option>
              <option value="CREATED">{t("orders.status.CREATED")}</option>
              <option value="PROCESSING">{t("orders.status.PROCESSING")}</option>
              <option value="SUCCESSED">{t("orders.status.SUCCESSED")}</option>
              <option value="COMPLETED">{t("orders.status.COMPLETED")}</option>
              <option value="FAILED">{t("orders.status.FAILED")}</option>
            </select>
            <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}
              className={SELECT_CLASS}>
              <option value="">{t("orders.filter.allPayment")}</option>
              <option value="CARD">{t("orders.payment.CARD")}</option>
              <option value="GOOGLEPAY">{t("orders.payment.GOOGLEPAY")}</option>
              <option value="APPLEPAY">{t("orders.payment.APPLEPAY")}</option>
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                min={minDate}
                max={endDate || today}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]"
                placeholder={t("orders.filter.startDate")}
              />
              <span className="text-[var(--gray-400)]">—</span>
              <input
                type="date"
                value={endDate}
                min={startDate || minDate}
                max={today}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="border border-[var(--gray-300)] rounded-lg px-3 py-2 text-sm text-[var(--gray-700)]"
                placeholder={t("orders.filter.endDate")}
              />
            </div>
          </div>
          <button onClick={handleExportCsv} disabled={total === 0}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-30 transition-colors"
            title={t("orders.exportHint")}>
            <ArrowDownTrayIcon className="w-4 h-4" />{t("orders.export")}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-[var(--gray-400)]">
            <InboxIcon className="w-10 h-10 mx-auto mb-3 text-[var(--gray-300)]" />
            <p className="text-sm font-medium text-[var(--gray-500)]">{t("orders.empty")}</p>
            <p className="text-xs text-[var(--gray-400)] mt-1">{t("orders.emptyHint")}</p>
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
          <div className="px-6 py-4 border-t border-[var(--gray-100)] flex items-center justify-between text-sm flex-wrap gap-3">
            {/* Left: total + page size */}
            <div className="flex items-center gap-4">
              <span className="text-[var(--gray-500)]">{t("orders.total", { count: total })}</span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--gray-500)]">{t("orders.perPage")}</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={SELECT_CLASS + " py-1.5"}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: page navigation */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => goToPage(1)} disabled={page <= 1}
                className="px-2 py-1.5 rounded border border-[var(--gray-300)] text-xs disabled:opacity-30 hover:bg-[var(--gray-50)]">
                1
              </button>
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              {/* Page number input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) goToPage(v);
                  }}
                  className="w-12 text-center border border-[var(--gray-300)] rounded-lg py-1.5 text-sm text-[var(--gray-700)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[var(--gray-400)]">/</span>
                <span className="text-[var(--gray-700)]">{totalPages}</span>
              </div>

              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(totalPages)} disabled={page >= totalPages}
                className="px-2 py-1.5 rounded border border-[var(--gray-300)] text-xs disabled:opacity-30 hover:bg-[var(--gray-50)]">
                {totalPages}
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
