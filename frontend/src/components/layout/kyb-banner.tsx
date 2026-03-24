"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { kybService } from "@/services/kybService";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function KybBanner() {
  const [kybStatus, setKybStatus] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    kybService.getStatus()
      .then((res) => setKybStatus(res.kybStatus))
      .catch(() => {});
  }, []);

  // Don't show on KYB page itself, or if status is approved/pending/loading
  if (!kybStatus || kybStatus === "APPROVED" || kybStatus === "PENDING" || pathname === "/kyb") {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {kybStatus === "REJECTED"
          ? "您的 KYB 认证未通过，请修改后重新提交。"
          : "请完成 KYB 认证以开通全部功能。"}
      </p>
      <Link
        href="/kyb"
        className="text-sm font-medium text-amber-800 hover:text-amber-900 underline flex-shrink-0"
      >
        {kybStatus === "REJECTED" ? "重新提交" : "去认证"}
      </Link>
    </div>
  );
}
