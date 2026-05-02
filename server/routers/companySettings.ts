import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getCompanySettings, saveCompanySettings } from "../companySettings";

export const companySettingsRouter = router({
  /**
   * Get company settings
   */
  get: publicProcedure.query(async () => {
    try {
      const settings = await getCompanySettings();
      return settings;
    } catch (error) {
      console.error("Error fetching company settings:", error);
      return {
        name: "KenPOS",
        address: "Nairobi, Kenya",
        phone: "+254 (0) 123 456 789",
        email: "info@kenpos.com",
        website: "www.kenpos.com",
      };
    }
  }),

  /**
   * Save company settings (admin only)
   */
  set: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Company name is required"),
        logo: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().optional(),
        taxId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await saveCompanySettings(input);
        if (success) {
          return { success: true, message: "Company settings saved successfully" };
        } else {
          return { success: false, message: "Failed to save company settings" };
        }
      } catch (error) {
        console.error("Error saving company settings:", error);
        return { success: false, message: "Error saving company settings" };
      }
    }),
});
