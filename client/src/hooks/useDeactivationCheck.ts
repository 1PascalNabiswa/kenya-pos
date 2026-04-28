import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function useDeactivationCheck(onDeactivated: () => void) {
  const { user } = useAuth();
  const checkStatusQuery = trpc.auth.checkStatus.useQuery(undefined, {
    enabled: !!user, // Only run query if user is logged in
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (!user) return;

    // If the checkStatus query returns that user is not active, trigger deactivation
    if (checkStatusQuery.data && !checkStatusQuery.data.isActive) {
      onDeactivated();
    }
  }, [checkStatusQuery.data, user, onDeactivated]);
}
