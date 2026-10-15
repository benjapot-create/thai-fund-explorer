
import { secFetch } from "../secClient";

export interface FundNavItem {
  proj_id: string;
  unique_id: string | null;
  fund_class_name: string | null;
  nav_date: string | null;
  net_asset: number | null;
  last_val: number | null;
  sell_price: number | null;
  buy_price: number | null;
  sell_swap_price: number | null;
  buy_swap_price: number | null;
  last_upd_date: string | null;
}

export interface FundNavResponse {
  message: string;
  page_size: number;
  next_cursor: string | null;
  items: FundNavItem[];
}

/**
 * ดึงข้อมูล NAV หนึ่งหน้า
 */
export async function getFundNav(
  cursor?: string,
  projId?: string
): Promise<FundNavResponse> {
  return secFetch<FundNavResponse>(
    "/v2/fund/daily-info/nav",
    {
      cursor,
      projId,
    }
  );
}

/**
 * ดึงข้อมูล NAV ทุกหน้า
 */
export async function getAllFundNav(
  projId?: string
): Promise<FundNavItem[]> {
  const allItems: FundNavItem[] = [];
  const seenIds = new Set<string>();
  let cursor: string | undefined;

  do {
    const response = await getFundNav(cursor, projId);

    if (!response) {
    break;
    }

    for (const item of response.items ?? []) {
      const id = [
        item.proj_id,
        item.unique_id ?? "",
        item.nav_date ?? "",
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
 * ดึงประวัติ NAV ของกองทุนหนึ่งกอง
 * เรียงจากวันที่ล่าสุดไปเก่าสุด
 */
export async function getFundNavById(
  projId: string
): Promise<FundNavItem[]> {
  const items = await getAllFundNav(projId);

  return items.sort((a, b) =>
    (b.nav_date ?? "").localeCompare(a.nav_date ?? "")
  );
}

/**
 * ดึง NAV ล่าสุดของกองทุนหนึ่งกอง
 */
export async function getLatestFundNav(
  projId: string
): Promise<FundNavItem | null> {
  const items = await getFundNavById(projId);

  return items[0] ?? null;
}
