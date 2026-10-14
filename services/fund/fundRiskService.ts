export interface FundRiskSpectrum {
  proj_id: string;
  start_date: string;
  end_date: string;
  prospectus_type: string;
  risk_spectrum_desc: string;
  risk_spectrum: string;
  last_upd_date: string;
}

export interface FundRiskResponse {
  message: string;
  page_size: number;
  next_cursor: string | null;
  items: FundRiskSpectrum[];
}


function getLatestFundRisk(
  items: FundRiskSpectrum[]
): FundRiskSpectrum[] {
  const latestByFund = new Map<string, FundRiskSpectrum>();

  for (const item of items) {
    const id = item.proj_id?.trim();
    if (!id) continue;

    const current = latestByFund.get(id);

    if (
      !current ||
      new Date(item.last_upd_date).getTime() >
        new Date(current.last_upd_date).getTime()
    ) {
      latestByFund.set(id, item);
    }
  }

  return Array.from(latestByFund.values());
}


export async function getFundRiskSpectrum(
  selectedIds?: string[]
): Promise<FundRiskResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // ถ้าระบุรหัสกองทุน ให้ค้นหาเฉพาะแต่ละรหัส
  if (selectedIds && selectedIds.length > 0) {
    const uniqueIds = [
      ...new Set(selectedIds.map((id) => id.trim()).filter(Boolean)),
    ];

    const responses = await Promise.all(
      uniqueIds.map(async (projId) => {
        const url = new URL("/api/fund-risk", baseUrl);
        url.searchParams.set("proj_id", projId);

        const response = await fetch(url.toString(), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Fund risk API Error: ${response.status}`);
        }

        const data = (await response.json()) as FundRiskResponse;
        return data.items ?? [];
      })
    );

    const latestItems = getLatestFundRisk(responses.flat());

    return {
      message: "success",
      page_size: latestItems.length,
      next_cursor: null,
      items: latestItems,
    };
  }

  // กรณีไม่ได้ระบุรหัสกองทุน คงพฤติกรรมเดิมในการดึงข้อมูลแบบแบ่งหน้า
  const allItems: FundRiskSpectrum[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 20;

  do {
    const url = new URL("/api/fund-risk", baseUrl);
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Fund risk API Error: ${response.status}`);
    }

    const data = (await response.json()) as FundRiskResponse;
    allItems.push(...(data.items ?? []));
    cursor = data.next_cursor || null;
    pageCount++;
  } while (cursor && pageCount < maxPages);

  const latestItems = getLatestFundRisk(allItems);

  return {
    message: "success",
    page_size: latestItems.length,
    next_cursor: cursor,
    items: latestItems,
  };

  console.log(
  "Latest Fund Risk:",
  latestItems.map((item) => ({
    proj_id: item.proj_id,
    last_upd_date: item.last_upd_date,
    risk_spectrum: item.risk_spectrum,
    risk_spectrum_desc: item.risk_spectrum_desc,
  }))
);
}
