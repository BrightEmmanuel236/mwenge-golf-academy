import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/admin/dashboard";

export const Route = createFileRoute("/admin/")({ component: Dashboard });
