import Link from "next/link";

type Props = {
  fund: any;
};

export default function FundCard({ fund }: Props) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">

      {/* Top accent */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

      <div className="flex flex-1 flex-col p-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">

          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01M15 12v.01M15 15v.01M15 18v.01"
                />
              </svg>
            </div>

            <div className="min-w-0 pt-0.5">
              <Link
                href={`/funds/${fund.proj_id}`}
                className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700"
              >
                {fund.proj_abbr_name || "ไม่ระบุชื่อกองทุน"}
              </Link>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {fund.comp_name_th || "ไม่ระบุบริษัท"}
              </p>
            </div>
          </div>

          {/* Status */}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {fund.fund_status || "ไม่ระบุสถานะ"}
          </span>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-slate-100" />

        {/* Fund name */}
        <div className="flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            FUND INFORMATION
          </p>

          <h3 className="line-clamp-3 text-base font-semibold leading-7 text-slate-800">
            {fund.proj_name_th || "ไม่มีรายละเอียดชื่อโครงการ"}
          </h3>

          {/* Policy */}
          <div className="mt-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M12 3l8.25 4.5v5.25c0 4.2-3.3 7.2-8.25 9-4.95-1.8-8.25-4.8-8.25-9V7.5L12 3Z"
                />
              </svg>

              <span className="text-xs font-bold tracking-wide text-blue-700">
                นโยบายกองทุน
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {fund.policy_desc || "ไม่มีข้อมูลนโยบาย"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <Link
            href={`/funds/${fund.proj_id}`}
            className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
          >
            <span>ดูรายละเอียดกองทุน</span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-7-7 7 7-7 7"
              />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
