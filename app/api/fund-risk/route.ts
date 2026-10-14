
import { NextRequest, NextResponse } from "next/server";
import { secFetch } from "../../../services/secClient";
import type { FundRiskResponse } from "../../../services/fund/fundRiskService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const projId = searchParams.get("proj_id")?.trim();
    const rawPageSize = Number(searchParams.get("page_size") || 100);

    const pageSize =
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, 1000)
        : 100;

    const endpoint = "/v2/fund/factsheet/risk-spectrum";

    console.log("Fund Risk request:", {
  projId,
  cursor,
  pageSize,
});

    const data = await secFetch<FundRiskResponse | null>(endpoint, {
      cursor: cursor || undefined,
      pageSize: projId ? undefined : pageSize,
      projId: projId || undefined,
    });

    console.log("Fund Risk result:", {
  isNull: data === null,
  itemCount: data?.items?.length,
  firstItem: data?.items?.[0],
});

    // SEC ตอบ 204 หมายถึงไม่มีข้อมูลสำหรับคำขอนี้
    if (data === null) {
      return NextResponse.json({
        message: "No Content",
        page_size: 0,
        next_cursor: null,
        items: [],
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fund risk API error:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถดึงข้อมูลระดับความเสี่ยงกองทุนได้",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}