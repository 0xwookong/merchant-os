"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import { useI18n } from "@/providers/language-provider";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function KybBanner() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { applicationStatus: status } = useApplicationStatus();

  // Don't show on the application page itself, or if approved/submitted/reviewing/loading
  if (!status || status === "APPROVED" || status === "SUBMITTED" || status === "UNDER_REVIEW" || pathname === "/organization/application") {
    return null;
  }

  const MESSAGE_MAP: Record<string, string> = {
    NOT_STARTED: t("nav.kybBanner.notStarted"),
    DRAFT: t("nav.kybBanner.notStarted"),
    REJECTED: t("nav.kybBanner.rejected"),
    NEED_MORE_INFO: t("nav.kybBanner.needMoreInfo"),
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {MESSAGE_MAP[status] || ""}
      </p>
      <Link
        href="/organization/application"
        className="text-sm font-medium text-amber-800 hover:text-amber-900 underline flex-shrink-0"
      >
        {status === "NOT_STARTED" || status === "DRAFT" ? t("nav.kybBanner.goVerify") : t("nav.kybBanner.goHandle")}
      </Link>
    </div>
  );
}
