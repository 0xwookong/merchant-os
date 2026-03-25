"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { kybService } from "@/services/kybService";
import { useI18n } from "@/providers/language-provider";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function KybBanner() {
  const { t } = useI18n();
  const [kybStatus, setKybStatus] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    kybService.getStatus()
      .then((res) => setKybStatus(res.kybStatus))
      .catch(() => {});
  }, []);

  // Don't show on KYB page itself, or if status is approved/pending/loading
  if (!kybStatus || kybStatus === "APPROVED" || kybStatus === "PENDING" || pathname === "/organization/kyb") {
    return null;
  }

  const MESSAGE_MAP: Record<string, string> = {
    NOT_STARTED: t("nav.kybBanner.notStarted"),
    REJECTED: t("nav.kybBanner.rejected"),
    NEED_MORE_INFO: t("nav.kybBanner.needMoreInfo"),
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {MESSAGE_MAP[kybStatus] || ""}
      </p>
      <Link
        href="/organization/kyb"
        className="text-sm font-medium text-amber-800 hover:text-amber-900 underline flex-shrink-0"
      >
        {kybStatus === "NOT_STARTED" ? t("nav.kybBanner.goVerify") : t("nav.kybBanner.goHandle")}
      </Link>
    </div>
  );
}
