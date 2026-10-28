import { useLocation } from "@tanstack/react-router";

export function usePathname(): string {
  return useLocation({ select: (l) => l.pathname });
}
