import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function useDeactivationCheck(onDeactivated: () => void) {
  const { user } = useAuth();
  const hasNotifiedRef = useRef(false);
  
  const checkStatusQuery = trpc.auth.checkStatus.useQuery(undefined, {
    enabled: !!user, // Only run query if user is logged in
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  useEffect(() => {
    if (!user || !checkStatusQuery.data) return;

    // If the checkStatus query returns that user is not active, trigger deactivation
    // Use a ref to ensure we only notify once
    if (!checkStatusQuery.data.isActive && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onDeactivated();
    }
  }, [checkStatusQuery.data?.isActive, user?.id]);
}
