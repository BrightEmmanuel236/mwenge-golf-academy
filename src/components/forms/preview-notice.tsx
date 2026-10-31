import * as React from "react";
import { Alert } from "@/components/ui/alert";

/**
 * Shown after a valid submission while forms are not connected. It must never imply that
 * anything was sent, saved or paid.
 */
export function PreviewNotice({ children }: { children: React.ReactNode }) {
  return (
    <Alert tone="warning" title="Preview only: nothing was sent">
      {children}
    </Alert>
  );
}
