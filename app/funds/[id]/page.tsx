import Link from "next/link";

import { getFundById } from "@/services/fund/fundProfileService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FundDetailPage({ params }: Props) {
  const { id } = await params;

  const fund = await getFundById(id);

  if (!fund) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            ไม่พบข้อมูลกองทุน
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            ไม่พบข้อมูลกองทุนที่ต้องการ หรือข้อมูลอาจถูกลบออกจากระบบ
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            ← กลับหน้ารายการกองทุน
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            ← กลับหน้ารายการกองทุน
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Fund Header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-8 text-white">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  Fund Profile
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                  {fund.proj_abbr_name}
                </h1>

                <p className="mt-2 max-w-3xl text-base text-blue-100">
                  {fund.proj_name_th}
                </p>

                <p className="mt-3 text-sm text-blue-200">
                  {fund.comp_name_th}
                </p>
              </div>

              {/* Status */}
              <div className="shrink-0">
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-blue-200">สถานะกองทุน</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fund.fund_status || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            <InfoItem
              label="Project ID"
              value={fund.proj_id}
            />

            <InfoItem
              label="Fund Class"
              value={fund.fund_class_name}
            />

            <InfoItem
              label="ประเภทกองทุน"
              value={fund.policy_desc}
            />
          </div>
        </section>

        {/* Main Information */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              ข้อมูลกองทุน
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              รายละเอียดข้อมูลที่ได้รับจาก SEC
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon="📊"
              title="สถานะกองทุน"
              value={fund.fund_status}
            />

            <InfoCard
              icon="📁"
              title="ประเภทกองทุน"
              value={fund.policy_desc}
            />

            <InfoCard
              icon="🏷️"
              title="Fund Class"
              value={fund.fund_class_name}
            />

            <InfoCard
              icon="🆔"
              title="Project ID"
              value={fund.proj_id}
            />

            <InfoCard
              icon="🏢"
              title="บริษัทจัดการ"
              value={fund.comp_name_th}
            />

            <InfoCard
              icon="📌"
              title="ชื่อย่อกองทุน"
              value={fund.proj_abbr_name}
            />
          </div>
        </section>

        {/* Raw Data */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <details>
            <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              🔍 ดูข้อมูลดิบจาก SEC
            </summary>

            <div className="border-t border-slate-200 bg-slate-950 p-6">
              <pre className="max-h-[500px] overflow-auto text-xs leading-6 text-slate-300">
                {JSON.stringify(fund, null, 2)}
              </pre>
            </div>
          </details>
        </section>

        {/* Footer */}
        <div className="py-8 text-center text-xs text-slate-400">
          Fund Profile • SEC Data
        </div>
      </div>
    </main>
  );
}

/* =========================
   Components
========================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {String(value ?? "-")}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value?: string | number | null;
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 break-words text-base font-semibold text-slate-800">
            {String(value ?? "-")}
          </p>
        </div>
      </div>
    </div>
  );
}