import { getDb } from "./db";
import { settings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

const COMPANY_SETTINGS_PREFIX = "company_";

/**
 * Get all company settings from database
 */
export async function getCompanySettings(): Promise<CompanyInfo> {
  try {
    const db = await getDb();
    if (!db) {
      return getDefaultCompanyInfo();
    }

    // Fetch all company settings - get each setting individually
    const settingKeys = [
      `${COMPANY_SETTINGS_PREFIX}name`,
      `${COMPANY_SETTINGS_PREFIX}logo`,
      `${COMPANY_SETTINGS_PREFIX}address`,
      `${COMPANY_SETTINGS_PREFIX}phone`,
      `${COMPANY_SETTINGS_PREFIX}email`,
      `${COMPANY_SETTINGS_PREFIX}website`,
      `${COMPANY_SETTINGS_PREFIX}taxId`,
    ];

    const allSettings = [];
    for (const key of settingKeys) {
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);
      if (result.length > 0) {
        allSettings.push(result[0]);
      }
    }

    const result: CompanyInfo = {
      name: "KenPOS",
    };

    for (const setting of allSettings) {
      const key = setting.key.replace(COMPANY_SETTINGS_PREFIX, "");
      if (key === "name") result.name = setting.value;
      if (key === "logo") result.logo = setting.value;
      if (key === "address") result.address = setting.value;
      if (key === "phone") result.phone = setting.value;
      if (key === "email") result.email = setting.value;
      if (key === "website") result.website = setting.value;
      if (key === "taxId") result.taxId = setting.value;
    }

    return result;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return getDefaultCompanyInfo();
  }
}

/**
 * Save company settings to database
 */
export async function saveCompanySettings(info: CompanyInfo): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    // Limit logo size to prevent database column overflow (max 50KB for base64)
    let logoValue = info.logo || "";
    if (logoValue && logoValue.length > 50000) {
      console.warn("Logo image too large, truncating to 50KB");
      logoValue = logoValue.substring(0, 50000);
    }

    const settingsToSave = [
      { key: `${COMPANY_SETTINGS_PREFIX}name`, value: info.name },
      { key: `${COMPANY_SETTINGS_PREFIX}logo`, value: logoValue },
      { key: `${COMPANY_SETTINGS_PREFIX}address`, value: info.address || "" },
      { key: `${COMPANY_SETTINGS_PREFIX}phone`, value: info.phone || "" },
      { key: `${COMPANY_SETTINGS_PREFIX}email`, value: info.email || "" },
      { key: `${COMPANY_SETTINGS_PREFIX}website`, value: info.website || "" },
      { key: `${COMPANY_SETTINGS_PREFIX}taxId`, value: info.taxId || "" },
    ];

    for (const setting of settingsToSave) {
      // Check if setting exists
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, setting.key));

      if (existing.length > 0) {
        // Update existing
        await db
          .update(settings)
          .set({ value: setting.value })
          .where(eq(settings.key, setting.key));
      } else {
        // Insert new
        await db.insert(settings).values(setting);
      }
    }

    return true;
  } catch (error) {
    console.error("Error saving company settings:", error);
    return false;
  }
}

/**
 * Get default company info
 */
function getDefaultCompanyInfo(): CompanyInfo {
  return {
    name: "KenPOS",
    address: "Nairobi, Kenya",
    phone: "+254 (0) 123 456 789",
    email: "info@kenpos.com",
    website: "www.kenpos.com",
  };
}
