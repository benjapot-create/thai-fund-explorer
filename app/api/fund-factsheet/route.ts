
import { NextRequest, NextResponse } from "next/server";
import { getLatestFundFactsheet } from "../../../services/fund/fundFactsheetService";

export async function GET(request: NextRequest) {
  const projId = request.nextUrl.searchParams.get("proj_id");

  if (!projId) {
    return NextResponse.json(
      {
        message: "error",
        error: "กรุณาระบุ proj_id",
      },
      { status: 400 }
    );
  }

  try {
    const item = await getLatestFundFactsheet(projId);

    return NextResponse.json({
      message: "success",
      item,
    });
  } catch (error) {
    console.error("Fund Factsheet API error:", error);

    return NextResponse.json(
      {
        message: "error",
        error: "ไม่สามารถโหลดข้อมูล Fund Factsheet ได้",
      },
      { status: 500 }
    );
  }
}
