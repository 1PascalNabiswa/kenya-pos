import { useAuth } from "@/_core/hooks/useAuth";
import { getDefaultLandingPage } from "@/lib/rolePageAccess";

/**
 * Hook to get the default landing page for the current user based on their role
 */
export function useDefaultLandingPage(): string {
  const { user } = useAuth();
  
  if (!user) {
    return "/sales/pos"; // Fallback for unauthenticated users
  }
  
  return getDefaultLandingPage(user.role);
}
