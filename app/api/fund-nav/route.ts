
import { NextResponse } from "next/server";
import { getLatestFundNav } from "@/services/fund/fundNavService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projId = searchParams.get("proj_id");

    if (!projId) {
      return NextResponse.json(
        { message: "กรุณาระบุ proj_id" },
        { status: 400 }
      );
    }

    const nav = await getLatestFundNav(projId);

    return NextResponse.json({
      message: "success",
      item: nav,
    });
  } catch (error) {
    console.error("Fund NAV API error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูล NAV ได้" },
      { status: 500 }
    );
  }
}
