
import { readFile } from "node:fs/promises";
import path from "node:path";
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
  const filePath = path.join(
    process.cwd(),
    "data",
    "fund-profiles-active.json"
  );

  let funds: FundProfile[];

  try {
    const raw = await readFile(filePath, "utf8");
    funds = JSON.parse(raw) as FundProfile[];
  } catch {
    throw new Error(
      "ไม่สามารถอ่าน data/fund-profiles-active.json ได้ กรุณาตรวจสอบว่าไฟล์มีอยู่จริง"
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7F6] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 sm:h-6 sm:w-6"
                aria-hidden="true"
              >
                <path
                  d="M3 17l6-6 4 3 8-9M15 5h6v6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight sm:text-lg">
                Thai Fund Explorer
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Fund Research &amp; Comparison
              </p>
            </div>
          </a>

          <a
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="m15 18-6-6 6-6M9 12h12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>หน้าหลัก</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        {/* Hero */}
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] px-5 py-7 text-white shadow-xl shadow-emerald-950/10 sm:mb-8 sm:px-9 sm:py-10 lg:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl"
          />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              FUND RESEARCH WORKSPACE
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:mt-6 sm:text-4xl lg:text-5xl">
              เปรียบเทียบกองทุน
              <br />
              <span className="text-emerald-300">
                ด้วยข้อมูลที่เข้าใจง่าย
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:mt-5 sm:text-base sm:leading-8">
              ค้นหาและเปรียบเทียบข้อมูลกองทุนรวมในพื้นที่ทำงานเดียว
              พร้อมดูข้อมูลความเสี่ยงและประวัติ NAV ของกองทุนที่คุณสนใจ
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
              <a
                href="#fund-workspace"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                เริ่มเปรียบเทียบ
                <span aria-hidden="true">→</span>
              </a>

              <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/90">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                ข้อมูลกองทุนในระบบ
              </span>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section
          aria-label="ภาพรวมข้อมูลกองทุน"
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  กองทุนในระบบ
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {funds.length.toLocaleString("th-TH")}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  รายการข้อมูลกองทุนที่พร้อมให้ค้นหา
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5zM4 7h16M8 11h7M8 14h5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  เครื่องมือวิเคราะห์
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                  Fund Comparison
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  เลือกกองทุนเพื่อเปรียบเทียบข้อมูล
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 19V5M4 19h16M8 15v-4M12 15V7M16 15v-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:col-span-2 sm:p-6 lg:col-span-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  ช่วงการใช้งาน
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                  Search &amp; Analyze
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  ค้นหา กรอง และศึกษาข้อมูลกองทุน
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path
                    d="m16 16 4.5 4.5M8 10.8h5.6M10.8 8v5.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Fund comparison workspace */}
        <section id="fund-workspace" className="scroll-mt-24">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Discover &amp; Compare
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                พื้นที่เปรียบเทียบกองทุน
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                ค้นหากองทุน เลือกรายการที่สนใจ และดูข้อมูลประกอบการเปรียบเทียบ
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {funds.length.toLocaleString("th-TH")} กองทุน
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
            <FundLabClient funds={funds} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-5 pb-4 sm:mt-14 sm:pt-6">
          <div className="flex flex-col gap-2 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Thai Fund Explorer
            </p>
            <p>
              ข้อมูลมีไว้เพื่อการศึกษา ไม่ใช่คำแนะนำในการลงทุน
            </p>
          </div>
        </footer>
      </div>
    </main>
  );

}