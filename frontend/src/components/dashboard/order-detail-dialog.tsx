"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { orderService, type OrderDetail } from "@/services/orderService";

const STATUS_LABELS: Record<string, string> = {
  CREATED: "已创建", PROCESSING: "处理中", SUCCESSED: "支付成功", COMPLETED: "已完成", FAILED: "失败",
};
const PAYMENT_LABELS: Record<string, string> = {
  CARD: "银行卡", GOOGLEPAY: "Google Pay", APPLEPAY: "Apple Pay",
};

interface Props {
  orderId: number | null;
  onClose: () => void;
}

export default function OrderDetailDialog({ orderId, onClose }: Props) {
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
              订单详情
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-[var(--gray-100)]" aria-label="关闭">
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
              <Section title="基本信息">
                <InfoGrid>
                  <Info label="订单号" value={detail.orderNo} mono />
                  <Info label="状态" value={STATUS_LABELS[detail.status] || detail.status} />
                  <Info label="支付方式" value={PAYMENT_LABELS[detail.paymentMethod] || detail.paymentMethod} />
                  <Info label="创建时间" value={new Date(detail.createdAt).toLocaleString("zh-CN")} />
                </InfoGrid>
              </Section>

              {/* Fiat info */}
              <Section title="法币信息">
                <InfoGrid>
                  <Info label="金额" value={`$${detail.fiatAmount}`} />
                  <Info label="币种" value={detail.fiatCurrency} />
                </InfoGrid>
              </Section>

              {/* Crypto info */}
              {detail.cryptoAmount && (
                <Section title="加密货币信息">
                  <InfoGrid>
                    <Info label="数量" value={`${detail.cryptoAmount} ${detail.cryptoCurrency}`} />
                    <Info label="网络" value={detail.cryptoNetwork} />
                    <Info label="目标地址" value={detail.walletAddress} mono />
                  </InfoGrid>
                </Section>
              )}

              {/* On-chain info */}
              {detail.txHash && (
                <Section title="链上信息">
                  <InfoGrid>
                    <Info label="交易哈希" value={detail.txHash} mono />
                    <Info label="区块高度" value={detail.blockHeight?.toLocaleString()} />
                    <Info label="确认数" value={detail.confirmations?.toString()} />
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
        {value || "-"}
      </dd>
    </div>
  );
}
