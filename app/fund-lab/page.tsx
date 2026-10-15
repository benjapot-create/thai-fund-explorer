export const dynamic = "force-dynamic";
import FundLabClient from "./FundLabClient";

export interface FundProfile {
  proj_id: string;
  proj_name_th?: string;
  proj_name_en?: string;
  proj_abbr_name?: string;
  comp_name_th?: string;
  fund_status?: string;
  policy_desc?: string;
  investment_policy_desc?: string;
  management_style?: string;
  init_date?: string;
  regis_date?: string;
  cancel_date?: string;
  proj_retail_type?: string;
  proj_term_flag?: string;
  proj_term_day?: number | null;
  proj_term_month?: number | null;
  proj_term_year?: number | null;
}


export default async function FundLabPage() {
  let funds: FundProfile[];

  try {
    const fileUrl = process.env.FUND_LAB_JSON_URL;

    if (!fileUrl) {
      throw new Error("ไม่พบ FUND_LAB_JSON_URL ใน .env.local");
    }

    const response = await fetch(fileUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
      `โหลดข้อมูลจาก Cloudflare R2 ไม่สำเร็จ: HTTP ${response.status}`
      );
    }

    const parsed = await response.json();

    if (!Array.isArray(parsed)) {
      throw new Error("ข้อมูลกองทุนไม่ใช่ Array");
    }

    // ส่งต่อเฉพาะฟิลด์ที่ใช้ในหน้า Fund Lab
    funds = parsed.map((fund) => ({
      proj_id: fund.proj_id,
      proj_name_th: fund.proj_name_th,
      proj_name_en: fund.proj_name_en,
      proj_abbr_name: fund.proj_abbr_name,
      comp_name_th: fund.comp_name_th,
      fund_status: fund.fund_status,
      policy_desc: fund.policy_desc,
      investment_policy_desc: fund.investment_policy_desc,
      management_style: fund.management_style,
      init_date: fund.init_date,
      regis_date: fund.regis_date,
      cancel_date: fund.cancel_date,
      proj_retail_type: fund.proj_retail_type,
      proj_term_flag: fund.proj_term_flag,
      proj_term_day: fund.proj_term_day,
      proj_term_month: fund.proj_term_month,
      proj_term_year: fund.proj_term_year,
    }));
 
   } catch (error) {
     console.error("Fund Lab page error:", error);

     throw new Error(
       "ไม่สามารถโหลดข้อมูลกองทุนได้ กรุณาตรวจสอบ Cloudflare R2 และ Fund Lab API"
     );
   }

  // return <FundLabClient funds={funds} />;

return (
  <main className="min-h-screen bg-slate-50 text-slate-900">
    {/* Header */}
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">
            Thai Fund Explorer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your guide to Thai mutual funds
          </p>
        </div>

        <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          SEC Open API
        </span>
      </div>
    </header>

    {/* Green Hero */}
    <section className="bg-slate-50 px-6 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-6 py-10 text-white shadow-lg sm:px-12 sm:py-14">

        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
          THAI MUTUAL FUND PLATFORM
        </p>

        <h2 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Explore Funds.
          <br />
          Invest Smarter.
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50 sm:text-lg">
          สำรวจข้อมูลกองทุนรวมไทย เปรียบเทียบรายละเอียด
          และทำความเข้าใจนโยบายการลงทุนได้ง่ายขึ้น
          ด้วยข้อมูลที่รวบรวมไว้ในที่เดียว
        </p>

        <a
          href="#funds"
          className="mt-8 inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-emerald-800 shadow-lg transition hover:bg-emerald-50"
        >
          เริ่มสำรวจกองทุน
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </section>

    {/* Overview Cards */}
    <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
      <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
          📊
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Compare Funds
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          เปรียบเทียบข้อมูลและรายละเอียดกองทุนเพื่อช่วยประกอบการตัดสินใจ
        </p>
      </article>

      <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
          🔎
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Search & Analyze
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          ค้นหาและสำรวจนโยบายการลงทุน รวมถึงรายละเอียดสำคัญของกองทุน
        </p>
      </article>

      <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
          🌱
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Fund Explorer
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          รวมข้อมูลกองทุนไว้ในพื้นที่เดียว พร้อมสำรวจข้อมูลได้สะดวกขึ้น
        </p>
      </article>
    </section>

    {/* Existing Fund Lab */}
    <section id="funds" className="mx-auto max-w-7xl px-6 pb-16">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          FUND DISCOVERY
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          พื้นที่เปรียบเทียบกองทุน
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          ค้นหาและเปรียบเทียบกองทุน โดยใช้เครื่องมือและข้อมูลที่มีอยู่เดิม
        </p>
      </div>

      <FundLabClient funds={funds} />
    </section>

    {/* Footer */}
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-500">
        Thai Fund Explorer · ข้อมูลเพื่อการศึกษาและประกอบการตัดสินใจ
      </div>
    </footer>
  </main>
);
}