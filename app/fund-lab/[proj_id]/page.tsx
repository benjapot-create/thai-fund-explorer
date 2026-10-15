import FundNavHistoryChart from "./FundNavHistoryChart";
import Link from "next/link";

type FundFactsheetItem = {
  proj_id: string;
  fund_class_name: string | null;
  prospectus_type: string | null;
  amc_url_factsheet: string | null;
  pdf_factsheet: string | null;
  as_of_date: string | null;
  last_upd_date: string | null;
};

type FundProfile = {
  proj_id: string;
  proj_name_th?: string;
  proj_name_en?: string;
  comp_name_th?: string;
  proj_retail_type?: string;
  policy_desc?: string;
  investment_policy_desc?: string;
};

async function getFunds(): Promise<FundProfile[]> {
  const fileUrl = process.env.FUND_LAB_JSON_URL;

  if (!fileUrl) {
    throw new Error("ไม่พบ FUND_LAB_JSON_URL ใน Environment Variables");
  }

  const response = await fetch(fileUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `โหลดข้อมูลกองทุนจาก Cloudflare R2 ไม่สำเร็จ: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("ข้อมูลกองทุนจาก Cloudflare R2 ไม่ใช่ Array");
  }

  return data as FundProfile[];
}


const currentYear = new Date().getFullYear();

async function getFundFactsheet(
  projId: string
): Promise<FundFactsheetItem | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/fund-factsheet?proj_id=${encodeURIComponent(projId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("ไม่สามารถโหลดข้อมูล Fund Factsheet ได้");
  }

  const data: {
    message: string;
    item: FundFactsheetItem | null;
  } = await response.json();

  if (data.message !== "success") {
    throw new Error("API Fund Factsheet ส่งข้อมูลไม่สำเร็จ");
  }

  return data.item;
}

function formatThaiDate(value: string | null): string {
  if (!value) return "ไม่มีข้อมูล";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${Number(match[1]) + 543}`;
}



export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ proj_id: string }>;
}) {
  const { proj_id } = await params;
  console.log("FUND DETAIL PAGE:", proj_id);

  const factsheet = await getFundFactsheet(proj_id);
  const funds = await getFunds();

  const fund = funds.find(
    (item) => String(item.proj_id).trim() === proj_id.trim()
  );


  return (
    <main className="min-h-screen bg-[#F5F7F6] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/fund-lab" className="font-bold text-emerald-800">
            Thai Fund Explorer
          </Link>
          <Link href="/fund-lab"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
          ← กลับไปหน้ากองทุน
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <p className="text-sm font-semibold text-emerald-700">
          FUND DETAILS
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          รายละเอียดกองทุน
        </h1>

        <p className="mt-2 text-slate-500">
          รหัสกองทุน: {proj_id}
        </p>

        {fund && (
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <h2 className="text-xl font-bold">
      {fund.proj_name_th || fund.proj_name_en || "ไม่มีชื่อกองทุน"}
    </h2>

    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-sm text-slate-500">
          ชื่อภาษาอังกฤษ
        </dt>
        <dd className="mt-1 font-medium">
          {fund.proj_name_en || "ไม่มีข้อมูล"}
        </dd>
      </div>

      <div>
        <dt className="text-sm text-slate-500">
          บริษัทจัดการกองทุน
        </dt>
        <dd className="mt-1 font-medium">
          {fund.comp_name_th || "ไม่มีข้อมูล"}
        </dd>
      </div>

      <div>
        <dt className="text-sm text-slate-500">
          ประเภทกองทุน
        </dt>
        <dd className="mt-1 font-medium">
          {fund.proj_retail_type || "ไม่มีข้อมูล"}
        </dd>
      </div>

      <div>
        <dt className="text-sm text-slate-500">
          นโยบายการลงทุน
        </dt>
        <dd className="mt-1 font-medium">
          {fund.policy_desc || fund.investment_policy_desc || "ไม่มีข้อมูล"}
        </dd>
      </div>
    </dl>
  </section>
        )}

        {!factsheet ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            ไม่พบข้อมูล Factsheet สำหรับกองทุนนี้
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                ข้อมูลทั่วไป
              </h2>

              <dl className="mt-5 divide-y divide-slate-100">
                <div className="grid gap-1 py-4 sm:grid-cols-2">
                  <dt className="text-sm text-slate-500">
                    รหัสกองทุน
                  </dt>
                  <dd className="font-medium">{factsheet.proj_id}</dd>
                </div>

                <div className="grid gap-1 py-4 sm:grid-cols-2">
                  <dt className="text-sm text-slate-500">
                    ชนิดหน่วยลงทุน
                  </dt>
                  <dd className="font-medium">
                    {factsheet.fund_class_name || "ไม่มีข้อมูล"}
                  </dd>
                </div>

                <div className="grid gap-1 py-4 sm:grid-cols-2">
                  <dt className="text-sm text-slate-500">
                    ประเภทหนังสือชี้ชวน
                  </dt>
                  <dd className="font-medium">
                    {factsheet.prospectus_type || "ไม่มีข้อมูล"}
                  </dd>
                </div>
                {/* กราฟ NAV เดิม */}
                <div className="mt-6">
                <FundNavHistoryChart
                projId={proj_id}
                fundClassName={factsheet.fund_class_name}
                />
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-2">
                  <dt className="text-sm text-slate-500">
                    วันที่ข้อมูลอ้างอิง
                  </dt>
                  <dd className="font-medium">
                    {formatThaiDate(factsheet.as_of_date)}
                  </dd>
                </div>

                <div className="grid gap-1 py-4 sm:grid-cols-2">
                  <dt className="text-sm text-slate-500">
                    วันที่ปรับปรุงล่าสุด
                  </dt>
                  <dd className="font-medium">
                    {formatThaiDate(factsheet.last_upd_date)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">
                เอกสารกองทุน
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                {factsheet.amc_url_factsheet && (
                  <a
                    href={factsheet.amc_url_factsheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    เปิด Factsheet จาก บลจ. ↗
                  </a>
                )}

                {factsheet.pdf_factsheet && (
                  <a
                    href={factsheet.pdf_factsheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    เปิดเอกสาร PDF ↗
                  </a>
                )}

                {!factsheet.amc_url_factsheet &&
                  !factsheet.pdf_factsheet && (
                    <p className="text-sm text-slate-500">
                      ยังไม่มีลิงก์เอกสารสำหรับกองทุนนี้
                    </p>
                  )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );


}
