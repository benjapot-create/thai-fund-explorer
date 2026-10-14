
const SEC_BASE_URL = "https://api.sec.or.th";

const SEC_API_KEY = process.env.SEC_API_KEY!;

type SecFetchOptions = {
  revalidate?: number;
  cursor?: string;
  pageSize?: number;
  projId?: string;
};

export async function secFetch<T>(
  endpoint: string,
  options: SecFetchOptions = {}
): Promise<T> {
  const { cursor, pageSize, projId } = options;

  // ประกาศ URL ก่อน แล้วค่อยเพิ่ม query parameters
  const url = new URL(`${SEC_BASE_URL}${endpoint}`);

  if (projId) {
    url.searchParams.set("proj_id", projId);
  }

  if (cursor) {
    url.searchParams.set("next_cursor", cursor);
  }

  if (pageSize !== undefined) {
    url.searchParams.set("page_size", String(pageSize));
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": SEC_API_KEY,
      },
      cache: "no-store",
    });

    // SEC ไม่พบข้อมูล
    if (response.status === 204) {
      return null as T;
    }

    if (!response.ok) {
      const body = await response.text();

      console.error("SEC API response error:", {
        endpoint,
        status: response.status,
        body: body.slice(0, 1000),
      });

      throw new Error(
        `SEC API Error: ${response.status} ${response.statusText}`
      );
    }

    const body = await response.text();

    if (!body.trim()) {
      throw new Error(
        `SEC API returned an empty response: ${endpoint}`
      );
    }

    try {
      return JSON.parse(body) as T;
    } catch {
      console.error("SEC API returned invalid JSON:", {
        endpoint,
        responsePreview: body.slice(0, 500),
      });

      throw new Error(
        `SEC API returned invalid JSON: ${endpoint}`
      );
    }
  } catch (error) {
    console.error("SEC fetch failed:", {
      endpoint,
      hasCursor: Boolean(cursor),
      hasProjId: Boolean(projId),
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    throw error;
  }
}