import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { readSnapshot, type StaffSnapshot } from "./auth";

export interface StaffState extends StaffSnapshot {
  /** True until the first check of the saved sign-in has finished. */
  loading: boolean;
  /** Re-reads the sign-in state, e.g. after a code is accepted. */
  refresh: () => Promise<void>;
}

const StaffContext = React.createContext<StaffState | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<StaffSnapshot & { loading: boolean }>({
    loading: true,
    step: "signin",
    email: null,
    roles: [],
  });

  const refresh = React.useCallback(async () => {
    try {
      setSnapshot({ loading: false, ...(await readSnapshot()) });
    } catch {
      // If the check itself fails, treat the person as signed out rather than letting them through.
      setSnapshot({ loading: false, step: "signin", email: null, roles: [] });
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Not awaited inside the callback: the auth library asks for that to avoid a deadlock.
      setTimeout(() => void refresh(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = React.useMemo(() => ({ ...snapshot, refresh }), [snapshot, refresh]);
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

// The provider and its hook belong together; splitting them would only spread one idea over two files.
// eslint-disable-next-line react-refresh/only-export-components
export function useStaff(): StaffState {
  const value = React.useContext(StaffContext);
  if (!value) throw new Error("useStaff must be used inside StaffProvider");
  return value;
}
