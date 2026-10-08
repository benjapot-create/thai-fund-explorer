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
  return secFetch<any>(
  "/v2/fund/general-info/profiles"
);
}

export async function getFundById(id: string) {
  const response = await getFundProfiles();

  return response.items.find(
    (item: any) => 
     item.proj_id === id
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

export async function getFundsByAMC(
  amcName: string
) {
  const response = await getFundProfiles();

  return response.items.filter(
     (item: any) =>
      item.comp_name_th === amcName
  );
}