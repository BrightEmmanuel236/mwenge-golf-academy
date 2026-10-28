import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const config = {
  info: { icon: Info, border: "border-l-info", iconClass: "text-info", role: "status" },
  success: {
    icon: CheckCircle2,
    border: "border-l-success",
    iconClass: "text-success",
    role: "status",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-warning",
    iconClass: "text-warning",
    role: "alert",
  },
  danger: { icon: XCircle, border: "border-l-danger", iconClass: "text-danger", role: "alert" },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof config;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, border, iconClass, role } = config[tone];
  return (
    <div
      role={role}
      className={cn(
        "border-line flex gap-3 rounded-md border border-l-4 bg-white p-4",
        border,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconClass)} aria-hidden="true" />
      <div className="text-sm">
        {title ? <p className="text-ink font-semibold">{title}</p> : null}
        {children ? <div className="text-slate">{children}</div> : null}
      </div>
    </div>
  );
}
