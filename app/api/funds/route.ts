
import { NextResponse } from "next/server";
import { getFundProfiles } from "../../../services/fund/fundProfileService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const data = await getFundProfiles(cursor);

    console.log("Fund API success:", {
      requestedCursor: cursor ? "มี cursor" : "หน้าแรก",
      itemsCount: data.items?.length ?? 0,
      nextCursor: data.next_cursor ? "มี cursor หน้าถัดไป" : "ไม่มี cursor หน้าถัดไป",
    });

    return NextResponse.json({
      items: data.items ?? [],
      next_cursor: data.next_cursor ?? "",
    });
  } catch (error) {
    console.error("Get funds error details:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถดึงข้อมูลกองทุนได้",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}