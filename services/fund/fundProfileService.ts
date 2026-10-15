const FUND_PROFILE_JSON_URL = process.env.FUND_PROFILE_JSON_URL;


export interface FundProfileResponse {
  message: string;
  page_size: number;
  next_cursor: string;
  items: any[];
}

type FundProfileJson = {
  items?: any[];
  data?: any[];
  funds?: any[];
  [key: string]: any;
};

let profilesCache: Promise<any[]> | null = null;


async function loadFundProfiles(): Promise<any[]> {
  const url = process.env.FUND_PROFILE_JSON_URL;

  if (!url) {
    throw new Error("Missing FUND_PROFILE_JSON_URL in .env.local");
  }
console.log("FUND_PROFILE_JSON_URL exists:", Boolean(url));
console.log("FUND_PROFILE_JSON_URL protocol:", url ? new URL(url).protocol : "missing");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fund Profile JSON error: ${response.status}`);
  }

  const json: any = await response.json();

  let items: any[];

  if (Array.isArray(json)) {
    items = json;
  } else if (Array.isArray(json.items)) {
    items = json.items;
  } else if (Array.isArray(json.data)) {
    items = json.data;
  } else if (Array.isArray(json.funds)) {
    items = json.funds;
  } else {
    throw new Error("Unsupported Fund Profile JSON format");
  }

  return items.filter(
    (item: any) =>
      item &&
      item.proj_id != null &&
      String(item.proj_id).trim() !== ""
  );
}
 
async function getCachedFundProfiles(): Promise<any[]> {
  if (!profilesCache) {
    profilesCache = loadFundProfiles().catch((error) => {
      profilesCache = null;
      throw error;
    });
  }

  return profilesCache;
}

export async function getFundProfiles(
  cursor?: string
): Promise<FundProfileResponse> {
  const allItems = await getCachedFundProfiles();

  // JSON index เป็นข้อมูลชุดเดียว จึงไม่มี cursor สำหรับแบ่งหน้า
  const items = cursor ? [] : allItems;

  return {
    message: "success",
    page_size: items.length,
    next_cursor: "",
    items,
  };
}

export async function getFundById(id: string) {
  const items = await getCachedFundProfiles();

  return items.find(
    (item) => String(item.proj_id).trim() === id.trim()
  );
}

export async function searchFunds(keyword: string) {
  const items = await getCachedFundProfiles();
  const search = keyword.trim().toLowerCase();

  if (!search) return items;

  return items.filter(
    (item) =>
      item.proj_abbr_name?.toLowerCase().includes(search) ||
      item.proj_name_th?.toLowerCase().includes(search) ||
      item.proj_name_en?.toLowerCase().includes(search) ||
      item.comp_name_th?.toLowerCase().includes(search)
  );
}

export async function getFundsByPolicy(policy: string) {
  const items = await getCachedFundProfiles();

  return items.filter((item) => item.policy_desc === policy);
}

export async function getAllFundProfiles() {
  return getCachedFundProfiles();
}

export async function getFundsByAMC(amcName: string) {
  const items = await getCachedFundProfiles();

  return items.filter((item) => item.comp_name_th === amcName);
}
