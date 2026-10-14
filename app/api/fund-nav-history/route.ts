import { NextRequest, NextResponse } from "next/server";
import { getFundNavById } from "../../../services/fund/fundNavService";

export async function GET(request: NextRequest) {
  const projId = request.nextUrl.searchParams.get("proj_id");

  if (!projId) {
    return NextResponse.json(
      { message: "error", error: "กรุณาระบุ proj_id" },
      { status: 400 }
    );
  }

  try {
    const items = await getFundNavById(projId);

    return NextResponse.json({
      message: "success",
      items,
    });
  } catch (error) {
    console.error("Fund NAV History API error:", error);

    return NextResponse.json(
      {
        message: "error",
        error: "ไม่สามารถโหลดประวัติ NAV ได้",
      },
      { status: 500 }
    );
  }
}