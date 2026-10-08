const SEC_BASE_URL = "https://api.sec.or.th";

const SEC_API_KEY = process.env.SEC_API_KEY!;

type SecFetchOptions = {
  revalidate?: number;
  cursor?: string;
};

export async function secFetch<T>(
  endpoint: string,
  options: SecFetchOptions = {}
): Promise<T> {
  const {
    revalidate = 3600,
    cursor,
  } = options;

  const url = new URL(
    `${SEC_BASE_URL}${endpoint}`
  );

  if (cursor) {
    url.searchParams.set(
      "cursor",
      cursor
    );
  }

  const response = await fetch(
    url.toString(),
    {
      headers: {
        "Content-Type":
          "application/json",
        "Ocp-Apim-Subscription-Key":
          SEC_API_KEY,
      },
      next: {
        revalidate,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `SEC API Error: ${response.status}`
    );
  }

  return response.json();
}