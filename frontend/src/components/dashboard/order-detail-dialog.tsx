"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { orderService, type OrderDetail } from "@/services/orderService";
import { useI18n } from "@/providers/language-provider";

interface Props {
  orderId: number | null;
  onClose: () => void;
}

export default function OrderDetailDialog({ orderId, onClose }: Props) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    orderService.getDetail(orderId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Dialog.Root open={orderId !== null} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-6 border-b border-[var(--gray-100)]">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">
              {t("orderDetail.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-[var(--gray-100)]" aria-label={t("common.close")}>
                <XMarkIcon className="w-5 h-5 text-[var(--gray-500)]" />
              </button>
            </Dialog.Close>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
            </div>
          ) : detail ? (
            <div className="p-6 space-y-6">
              {/* Basic info */}
              <Section title={t("orderDetail.section.basic")}>
                <InfoGrid>
                  <Info label={t("orderDetail.orderNo")} value={detail.orderNo} mono />
                  <Info label={t("orderDetail.status")} value={t(`orders.status.${detail.status}`)} />
                  <Info label={t("orderDetail.paymentMethod")} value={t(`orders.payment.${detail.paymentMethod}`)} />
                  <Info label={t("orderDetail.createdAt")} value={new Date(detail.createdAt).toLocaleString()} />
                </InfoGrid>
              </Section>

              {/* Fiat info */}
              <Section title={t("orderDetail.section.fiat")}>
                <InfoGrid>
                  <Info label={t("orderDetail.fiatAmount")} value={`${detail.fiatAmount} ${detail.fiatCurrency}`} />
                  <Info label={t("orderDetail.fiatCurrency")} value={detail.fiatCurrency} />
                </InfoGrid>
              </Section>

              {/* Crypto info */}
              {detail.cryptoAmount && (
                <Section title={t("orderDetail.section.crypto")}>
                  <InfoGrid>
                    <Info label={t("orderDetail.cryptoAmount")} value={`${detail.cryptoAmount} ${detail.cryptoCurrency}`} />
                    <Info label={t("orderDetail.cryptoNetwork")} value={detail.cryptoNetwork} />
                    <Info label={t("orderDetail.walletAddress")} value={detail.walletAddress} mono />
                  </InfoGrid>
                </Section>
              )}

              {/* On-chain info */}
              {detail.txHash && (
                <Section title={t("orderDetail.section.onchain")}>
                  <InfoGrid>
                    <Info label={t("orderDetail.txHash")} value={detail.txHash} mono />
                    <Info label={t("orderDetail.blockHeight")} value={detail.blockHeight?.toLocaleString()} />
                    <Info label={t("orderDetail.confirmations")} value={detail.confirmations?.toString()} />
                  </InfoGrid>
                </Section>
              )}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-3">{children}</div>;
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-[var(--gray-500)]">{label}</dt>
      <dd className={`text-sm text-[var(--gray-900)] mt-0.5 break-all ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}
