import { secFetch } from "../secClient";

export interface FundProfileResponse {
  message: string;
  page_size: number;
  next_cursor: string;
  items: any[];
}


export async function getFundProfiles(
  cursor?: string
) {
  return secFetch<FundProfileResponse>(
    "/v2/fund/general-info/profiles",
    { cursor }
  );
}


export async function getFundById(id: string) {
  const response = await getFundProfiles();

  return response.items.find(
    (item: any) =>
      String(item.proj_id).trim() === id.trim()
  );
}

export async function searchFunds(
  keyword: string
) {
  const response = await getFundProfiles();

  const search = keyword.toLowerCase();

  return response.items.filter((item: any) =>
    item.proj_abbr_name
      ?.toLowerCase()
      .includes(search) ||
    item.proj_name_th
      ?.toLowerCase()
      .includes(search) ||
    item.comp_name_th
      ?.toLowerCase()
      .includes(search)
  );
}

export async function getFundsByPolicy(
  policy: string
) {
  const response = await getFundProfiles();

  return response.items.filter(
     (item: any) => 
      item.policy_desc === policy
  );
}


export async function getAllFundProfiles() {
  const allItems: any[] = [];
  const seenIds = new Set<string>();
  let cursor: string | undefined;

  do {
    const response = await getFundProfiles(cursor);

    for (const item of response.items ?? []) {
      // ใช้ unique_id ตรวจสอบรายการซ้ำ
      const id = item.unique_id
        ? String(item.unique_id).trim()
        : "";

      if (id && seenIds.has(id)) {
        continue;
      }

      if (id) {
        seenIds.add(id);
      }

      allItems.push(item);
    }

    cursor = response.next_cursor || undefined;
  } while (cursor);

  return allItems;
}

export async function getFundsByAMC(amcName: string) {
  const items = await getAllFundProfiles();

  return items.filter(
    (item: any) => item.comp_name_th === amcName
  );
}
