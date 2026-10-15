
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

    const itemDate = Date.parse(item.last_upd_date);
    const currentDate = current
      ? Date.parse(current.last_upd_date)
      : Number.NEGATIVE_INFINITY;

    if (
      !current ||
      (Number.isFinite(itemDate) &&
        (!Number.isFinite(currentDate) || itemDate > currentDate))
    ) {
      latestByFund.set(id, item);
    }
  }

  return Array.from(latestByFund.values());
}


export async function getFundRiskSpectrum(
  selectedIds?: string[],
  baseUrl?: string
): Promise<FundRiskResponse> {
  async function fetchRiskPage(
    params: Record<string, string> = {}
  ): Promise<FundRiskResponse> {
    // Browser ใช้ URL ของเว็บปัจจุบัน ส่วน Server ต้องมี baseUrl
    const apiPath = "/api/fund-risk";
    const url =
      typeof window !== "undefined"
        ? new URL(apiPath, window.location.origin)
        : baseUrl
          ? new URL(apiPath, baseUrl)
          : process.env.APP_BASE_URL?.trim()
            ? new URL(apiPath, process.env.APP_BASE_URL?.trim())
            : null;

    if (!url) {
      throw new Error(
        "Missing baseUrl for server-side fund risk request"
      );
    }

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Fund risk API Error: ${response.status} ${response.statusText}` +
          (detail ? ` - ${detail.slice(0, 300)}` : "")
      );
    }

   /* const data = (await response.json()) as FundRiskResponse;

    if (!Array.isArray(data.items)) {
      throw new Error("Fund risk API returned an invalid items array");
    }*/

const responseText = await response.text();

let data: FundRiskResponse;

try {
  data = JSON.parse(responseText) as FundRiskResponse;
} catch {
  throw new Error(
    `Fund risk API returned non-JSON. URL: ${url.toString()}. ` +
      `Response: ${responseText.slice(0, 300)}`
  );
}

if (!Array.isArray(data.items)) {
  throw new Error("Fund risk API returned an invalid items array");
}
  

    return data;
  }

  let allItems: FundRiskSpectrum[] = [];

  if (selectedIds?.length) {
    const uniqueIds = [
      ...new Set(selectedIds.map((id) => id.trim()).filter(Boolean)),
    ];

    const responses = await Promise.all(
      uniqueIds.map((projId) =>
        fetchRiskPage({ proj_id: projId })
      )
    );

    allItems = responses.flatMap((data) => data.items);
  } else {
    let cursor: string | null = null;
    const seenCursors = new Set<string>();
    const maxPages = 20;
    let pageCount = 0;

    do {
      const params: Record<string, string> = {};
      if (cursor) params.cursor = cursor;

      const data = await fetchRiskPage(params);
      allItems.push(...data.items);

      cursor = data.next_cursor || null;
      pageCount++;

      if (cursor) {
        if (seenCursors.has(cursor)) {
          throw new Error("Fund risk API returned a repeated cursor");
        }
        seenCursors.add(cursor);
      }
    } while (cursor && pageCount < maxPages);

    if (cursor) {
      console.warn(
        `Fund risk pagination stopped after ${maxPages} pages.`
      );
    }
  }

  const latestItems = getLatestFundRisk(allItems);

  return {
    message: "success",
    page_size: latestItems.length,
    next_cursor: null,
    items: latestItems,
  };
}
