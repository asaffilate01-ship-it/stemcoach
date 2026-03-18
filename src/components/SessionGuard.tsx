import { useSession } from "@/hooks/useSession";

export function SessionGuard() {
  useSession();
  return null;
}
