
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fileUrl = process.env.FUND_PROFILE_JSON_URL;

    if (!fileUrl) {
      return NextResponse.json(
        { message: "ไม่พบ FUND_PROFILE_JSON_URL" },
        { status: 500 }
      );
    }

    const response = await fetch(fileUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Cloudflare R2 error:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          message: "ดาวน์โหลดไฟล์จาก Cloudflare R2 ไม่สำเร็จ",
          detail: `HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลไฟล์จาก Cloudflare R2" },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Fund Lab API error:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถโหลดข้อมูลกองทุนจาก Cloudflare R2 ได้",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 502 }
    );
  }
}
