import { secFetch } from "../secClient";

export interface FundNavItem {
  proj_id: string;
  proj_abbr_name: string;
  nav_date: string;
  nav: number;
  unit_price: number;
}

export interface FundNavResponse {
  message: string;
  page_size: number;
  next_cursor: string;
  items: FundNavItem[];
}

export async function getFundDailyNav() {
  return secFetch<FundNavResponse>(
    "/v2/fund/daily-info/nav"
  );
}

export async function getFundNavById(
  projId: string
) {
  const response = await getFundDailyNav();

  return response.items.filter(
    (item) => item.proj_id === projId
  );
}