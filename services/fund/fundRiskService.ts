import { secFetch } from "../secClient";

export interface FundRiskSpectrum {
  proj_id: string;
  proj_abbr_name: string;
  risk_spectrum_level: string;
  risk_spectrum_desc: string;
}

export interface FundRiskResponse {
  message: string;
  page_size: number;
  next_cursor: string;
  items: FundRiskSpectrum[];
}

export async function getFundRiskSpectrum() {
  return secFetch<FundRiskResponse>(
    "/v2/fund/factsheet/risk-spectrum"
  );
}

export async function getFundRiskById(
  projId: string
) {
  const response =
    await getFundRiskSpectrum();

  return response.items.find(
    (item) => item.proj_id === projId
  );
}