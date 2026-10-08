import FundList from "@/components/FundList";
import { getFundProfiles } from "@/services/fund/fundProfileService";

export default async function Home() {
const response = await getFundProfiles();
const funds = response.items ?? [];

return ( <main className="min-h-screen bg-[#F5F7F6] text-slate-900">
{/* Navigation */} <header className="border-b border-slate-200/80 bg-white"> <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"> <a href="/" className="flex items-center gap-3"> <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm"> <svg
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             strokeWidth="1.8"
             className="h-6 w-6"
           > <path
               d="M3 17l6-6 4 3 8-9M15 5h6v6"
               strokeLinecap="round"
               strokeLinejoin="round"
             /> </svg> </div>

```
        <div>
          <p className="text-lg font-bold tracking-tight">
            Thai Fund Explorer
          </p>
          <p className="text-xs text-slate-500">
            Your guide to Thai mutual funds
          </p>
        </div>
      </a>

      <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        SEC Open API
      </span>
    </div>
  </header>

  <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
    {/* Hero */}
    <section className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] px-6 py-10 text-white shadow-xl shadow-emerald-950/10 sm:px-10 sm:py-14 lg:px-14">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          THAILAND MUTUAL FUND DIRECTORY
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Explore Funds.
          <br />
          <span className="text-emerald-300">
            Invest Smarter.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base sm:leading-8">
          ค้นหา เปรียบเทียบ และสำรวจกองทุนรวมไทย
          ในที่เดียว พร้อมเข้าถึงข้อมูลกองทุนจาก SEC Open API
          เพื่อช่วยให้คุณศึกษาทางเลือกการลงทุนได้ง่ายขึ้น
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#funds"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          >
            สำรวจกองทุน
            <span aria-hidden="true">→</span>
          </a>

          <span className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-white/90">
            ข้อมูลกองทุนรวมไทย
          </span>
        </div>
      </div>
    </section>

    {/* Statistics */}
    <section
      aria-label="Fund statistics"
      className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              กองทุนในระบบ
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {funds.length.toLocaleString("th-TH")}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              รายการข้อมูลที่ได้รับจาก API
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6"
            >
              <path
                d="M4 19.5V5.8A1.8 1.8 0 0 1 5.8 4H20v16H5.8A1.8 1.8 0 0 1 4 18.2M4 16h16M8 8h7M8 11h5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              แหล่งข้อมูล
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              SEC Open API
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              แหล่งข้อมูลสำหรับศึกษากองทุน
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:col-span-2 lg:col-span-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              แพลตฟอร์ม
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Fund Explorer
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              สำรวจข้อมูลในรูปแบบที่เข้าใจง่าย
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6"
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
    </section>

    {/* Fund Explorer */}
    <section id="funds" className="scroll-mt-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Discover & Compare
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            สำรวจกองทุนรวม
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            ค้นหากองทุนที่สนใจ แล้วดูรายละเอียดเพิ่มเติมได้จากรายการด้านล่าง
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          ทั้งหมด {funds.length.toLocaleString("th-TH")} รายการ
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <FundList
          funds={funds}
          nextCursor={response.next_cursor}
        />
      </div>
    </section>

    {/* Footer */}
    <footer className="mt-14 border-t border-slate-200 pt-6 pb-4">
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