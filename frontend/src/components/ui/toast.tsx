"use client";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  return (
    <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border ${
      type === "success"
        ? "bg-white border-green-200 text-green-700"
        : "bg-white border-red-200 text-red-700"
    }`}>
      {type === "success"
        ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
        : <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--gray-100)] transition-colors ml-2">
        <XMarkIcon className="w-4 h-4 text-[var(--gray-400)]" />
      </button>
    </div>
  );
}
