import FundNavHistoryChart from "./FundNavHistoryChart";
import Link from "next/link";
import { getFundById } from "@/services/fund/fundProfileService";
import { getFundRiskSpectrum } from "@/services/fund/fundRiskService";
import { getLatestFundFactsheet } from "../../../services/fund/fundFactsheetService";

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
  const fileUrl = process.env.FUND_PROFILE_JSON_URL;

  if (!fileUrl) {
    throw new Error("ไม่พบ FUND_PROFILE_JSON_URL ใน Environment Variables");
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
  return getLatestFundFactsheet(projId);

}

function formatThaiDate(value: string | null): string {
  if (!value) return "ไม่มีข้อมูล";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${Number(match[1]) + 543}`;
}

/*เพิ่มฟังก์ชันช่วยแปลงระดับความเสี่ยง*/
function getRiskLevel(value: string): number | null {
  const match = value.trim().match(/^RS([1-8])$/i);
  return match ? Number(match[1]) : null;
}



export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ proj_id: string }>;
}) {
  const { proj_id } = await params;
  console.log("FUND DETAIL PAGE:", proj_id);

  const [factsheet, fund, riskResponse] = await Promise.all([
    getFundFactsheet(proj_id),
    getFundById(proj_id),
    getFundRiskSpectrum([proj_id]),
  ]);

  const risk = riskResponse.items?.[0] ?? null;
  const riskLevel = risk ? getRiskLevel(risk.risk_spectrum) : null;


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

    
        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p className="text-sm font-semibold text-emerald-700">
        FUND RISK PROFILE
      </p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">
        Risk Spectrum
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        ระดับความเสี่ยงของกองทุน
      </p>
    </div>


    {riskLevel !== null && (
  <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 px-6 py-4 text-center shadow-sm">
    <p className="text-sm font-semibold text-emerald-800">
      ระดับความเสี่ยงของกองทุนนี้
    </p>
    <p className="mt-1 text-base font-semibold text-emerald-800">
  ระดับ {riskLevel} / 8
</p>
  </div>
    )}

  </div>

  <div className="mt-6 grid grid-cols-8 gap-1.5 sm:gap-2">
    {[
      { level: 1, color: "bg-emerald-600" },
      { level: 2, color: "bg-green-500" },
      { level: 3, color: "bg-lime-500" },
      { level: 4, color: "bg-yellow-400" },
      { level: 5, color: "bg-amber-400" },
      { level: 6, color: "bg-orange-400" },
      { level: 7, color: "bg-orange-600" },
      { level: 8, color: "bg-red-600" },
    ].map(({ level, color }) => (
      <div key={level} className="min-w-0 text-center">
        <div
          className={`h-3 rounded-full ${color} ${
            riskLevel === level
              ? "ring-2 ring-slate-800 ring-offset-2"
              : "opacity-65"
          }`}
        />
        <p
          className={`mt-2 text-sm ${
            riskLevel === level
              ? "font-bold text-slate-900"
              : "text-slate-500"
          }`}
        >
          {level}
        </p>
      </div>
    ))}
  </div>

  <div className="mt-5 rounded-xl bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-500">
      คำอธิบายระดับความเสี่ยง
    </p>
    <p className="mt-1 font-semibold text-slate-800">
      {risk?.risk_spectrum_desc || "ไม่มีคำอธิบายระดับความเสี่ยง"}
    </p>

    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
      <p>
        วันที่ปรับปรุงล่าสุด:{" "}
        <span className="font-medium text-slate-700">
          {risk?.last_upd_date
            ? formatThaiDate(risk.last_upd_date)
            : "ไม่มีข้อมูล"}
        </span>
      </p>
      {risk?.prospectus_type && (
        <p>
          ประเภทหนังสือชี้ชวน:{" "}
          <span className="font-medium text-slate-700">
            {risk.prospectus_type}
          </span>
        </p>
      )}
    </div>
  </div>

  {!risk && (
    <p className="mt-4 text-sm text-amber-700">
      ไม่พบข้อมูล Risk Spectrum สำหรับกองทุนนี้
    </p>
  )}
        </section>

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