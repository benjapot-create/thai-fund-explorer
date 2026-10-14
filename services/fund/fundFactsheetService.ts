
import { secFetch } from "../secClient";

export interface FundFactsheetItem {
  proj_id: string;
  fund_class_name: string | null;
  prospectus_type: string | null;
  amc_url_factsheet: string | null;
  pdf_factsheet: string | null;
  as_of_date: string | null;
  last_upd_date: string | null;
}

export interface FundFactsheetResponse {
  message: string;
  page_size: number;
  next_cursor: string | null;
  items: FundFactsheetItem[];
}

/**
 * ดึงข้อมูล Fund Factsheet หนึ่งหน้า
 */
export async function getFundFactsheetUrls(
  cursor?: string,
  projId?: string
): Promise<FundFactsheetResponse> {
  return secFetch<FundFactsheetResponse>(
    "/v2/fund/factsheet/urls",
    {
      cursor,
      projId,
    }
  );
}

/**
 * ดึงข้อมูล Fund Factsheet ทุกหน้า
 */
export async function getAllFundFactsheetUrls(
  projId?: string
): Promise<FundFactsheetItem[]> {
  const allItems: FundFactsheetItem[] = [];
  const seenIds = new Set<string>();
  let cursor: string | undefined;

  do {
    const response = await getFundFactsheetUrls(cursor, projId);

    for (const item of response.items ?? []) {
      const id = [
        item.proj_id,
        item.fund_class_name ?? "",
        item.prospectus_type ?? "",
        item.as_of_date ?? "",
      ].join("_");

      if (seenIds.has(id)) {
        continue;
      }

      seenIds.add(id);
      allItems.push(item);
    }

    cursor = response.next_cursor || undefined;
  } while (cursor);

  return allItems;
}

/**
 * ดึงประวัติ Factsheet ของกองทุนหนึ่งกอง
 * เรียงจากวันที่อ้างอิงล่าสุดไปเก่าสุด
 */
export async function getFundFactsheetById(
  projId: string
): Promise<FundFactsheetItem[]> {
  const items = await getAllFundFactsheetUrls(projId);

  return items.sort((a, b) =>
    (b.as_of_date ?? "").localeCompare(a.as_of_date ?? "")
  );
}

/**
 * ดึง Factsheet ล่าสุดของกองทุนหนึ่งกอง
 */
export async function getLatestFundFactsheet(
  projId: string
): Promise<FundFactsheetItem | null> {
  const items = await getFundFactsheetById(projId);

  return items[0] ?? null;
}
