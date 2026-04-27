import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function useDeactivationCheck(onDeactivated: () => void) {
  const { user } = useAuth();
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  
  // Check auth status every 30 seconds to detect deactivation
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        // Try to fetch current user info
        // If the user is deactivated, the auth.me query will fail
        const response = await fetch("/api/trpc/auth.me?batch=1", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          // User is deactivated or session is invalid
          onDeactivated();
          clearInterval(interval);
          return;
        }

        const data = await response.json();
        
        // Check if response contains error (deactivation error)
        if (data[0]?.error) {
          onDeactivated();
          clearInterval(interval);
          return;
        }

        setLastCheckTime(Date.now());
      } catch (error) {
        console.error("Error checking deactivation status:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, onDeactivated]);
}
