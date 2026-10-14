"use client";

import { useEffect, useState } from "react";
import { getFundRiskSpectrum } from "../../../services/fund/fundRiskService";

type Fund = {
  proj_id: string | number;
  unique_id?: string;
  fund_class_isin_code?: string;
  proj_abbr_name?: string;
  proj_name_th?: string;
  comp_name_th?: string;
  policy_desc?: string;
  fund_class_name?: string;
  fund_status?: string;
};

type CompareRow = {
  label: string;
  key: keyof Fund | "risk_spectrum";
};

const compareRows: CompareRow[] = [
  { label: "ชื่อกองทุน", key: "proj_name_th" },
  { label: "บริษัทจัดการกองทุน", key: "comp_name_th" },
  { label: "นโยบายการลงทุน", key: "policy_desc" },
  { label: "ประเภทหน่วยลงทุน", key: "fund_class_name" },
  { label: "สถานะกองทุน", key: "fund_status" },
  { label: "ระดับความเสี่ยง", key: "risk_spectrum" },
  { label: "รหัสกองทุน", key: "proj_id" },
];

function getFundValue(fund: Fund, key: keyof Fund) {
  const value = fund[key];
  return value == null || value === "" ? "-" : String(value);
}

function getStatusStyle(status?: string) {
  const normalized = status?.toLowerCase();

  if (normalized === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (normalized === "liquidated" || normalized === "expired") {
    return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }

  return "bg-blue-50 text-blue-700 ring-blue-600/20";
}

export default function ComparePage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskMap, setRiskMap] = useState<
  Record<string, { level: string; desc: string; endDate: string }>
>({});

  // โหลดกองทุนที่เลือกไว้
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fundCompareSelection");

      if (!raw) {
        setError("ไม่พบข้อมูลกองทุนที่เลือก กรุณากลับไปเลือกรายการใหม่");
        return;
      }

      const selected: Fund[] = JSON.parse(raw);

      if (!Array.isArray(selected) || selected.length < 2) {
        setError("กรุณาเลือกกองทุนอย่างน้อย 2 กองทุน");
        return;
      }

      setFunds(selected);
    } catch (err) {
      console.error("Compare page error:", err);
      setError("ไม่สามารถอ่านข้อมูลกองทุนที่เลือกได้");
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดระดับความเสี่ยงหลังจากมีกองทุนที่เลือกแล้ว
  useEffect(() => {
    if (funds.length === 0) return;

    async function loadRiskData() {
      try {
        const response = await getFundRiskSpectrum(
        funds.map((fund) => String(fund.proj_id).trim())
        );

        console.log("Risk API data:", response.items);
        console.log(
  "Matched risk data:",
  response.items.filter((item) =>
    funds.some(
      (fund) =>
        String(fund.proj_id).trim() === String(item.proj_id).trim()
    )
  )
);
        console.log("Next cursor:", response.next_cursor);
        console.log(
          "Selected fund IDs:",
          funds.map((fund) => String(fund.proj_id).trim())
        );

        const map: Record<
  string,
  { level: string; desc: string; endDate: string }
> = {};

        for (const item of response.items ?? []) {
  const id = String(item.proj_id).trim();
  const existing = map[id];

  if (
    !existing ||
    new Date(item.end_date).getTime() >
      new Date(existing.endDate).getTime()
  ) {
    map[id] = {
      level: item.risk_spectrum,
      desc: item.risk_spectrum_desc,
      endDate: item.end_date,
    };
  }
}

        setRiskMap(map);
      } catch (err) {
        console.error("Load fund risk error:", err);
      }
    }

    loadRiskData();
  }, [funds]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-lg font-bold text-white shadow-sm">
              F
            </div>
            <div>
              <p className="font-bold tracking-tight text-slate-900">
                Fund Compare
              </p>
              <p className="text-xs text-slate-500">
                เปรียบเทียบกองทุนอย่างมั่นใจ
              </p>
            </div>
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 sm:px-4"
          >
            <span aria-hidden="true">←</span>
            <span>กลับหน้ารายการกองทุน</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-900">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            FUND ANALYSIS
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            เปรียบเทียบกองทุน
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            เปรียบเทียบข้อมูลสำคัญของกองทุนที่คุณเลือก
            เพื่อช่วยให้เห็นรายละเอียดของแต่ละกองทุนได้ในหน้าเดียว
          </p>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-800" />
            <p className="font-semibold text-slate-700">
              กำลังโหลดข้อมูลกองทุน...
            </p>
            <p className="mt-1 text-sm text-slate-400">กรุณารอสักครู่</p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
              !
            </span>
            <div>
              <p className="font-bold">แจ้งเตือน</p>
              <p className="mt-1 text-sm leading-6">{error}</p>
            </div>
          </div>
        )}

        {!loading && funds.length > 0 && (
          <>
            <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {funds.map((fund, index) => (
                <article
                  key={fund.proj_id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${
                      index === 0 ? "bg-blue-700" : "bg-sky-400"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        FUND {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-2 break-words text-xl font-extrabold text-slate-900">
                        {fund.proj_abbr_name || `กองทุน ${fund.proj_id}`}
                      </h2>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        index === 0
                          ? "bg-blue-50 text-blue-800"
                          : "bg-sky-50 text-sky-700"
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M4 19V9m5 10V5m5 14v-7m5 7V3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <p className="mt-4 min-h-12 text-sm font-semibold leading-6 text-slate-700">
                    {fund.proj_name_th || "ไม่พบชื่อกองทุน"}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                      บริษัทจัดการกองทุน
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                      {fund.comp_name_th || "-"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      รหัส: {fund.proj_id}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusStyle(
                        fund.fund_status
                      )}`}
                    >
                      {fund.fund_status || "ไม่ระบุสถานะ"}
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    รายละเอียดเปรียบเทียบ
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    ข้อมูลพื้นฐานของกองทุนที่เลือก
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">
                  {funds.length} กองทุนที่เลือก
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] table-fixed text-left text-sm">
                  <thead>
                    <tr className="bg-blue-950 text-white">
                      <th className="w-48 px-5 py-4 font-semibold sm:w-56">
                        รายการข้อมูล
                      </th>
                      {funds.map((fund, index) => (
                        <th
                          key={fund.proj_id}
                          className="px-5 py-4 font-semibold"
                        >
                          <span className="block text-xs font-medium text-blue-200">
                            กองทุน {index + 1}
                          </span>
                          <span className="mt-1 block break-words">
                            {fund.proj_abbr_name || fund.proj_id}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {compareRows.map((row, index) => (
                      <tr
                        key={row.key}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/80"
                        }
                      >
                        <th className="px-5 py-4 align-top font-semibold text-slate-600">
                          {row.label}
                        </th>

                        {funds.map((fund) => (
                          <td
                            key={fund.proj_id}
                            className="break-words px-5 py-4 align-top leading-7 text-slate-700"
                          >
                            {row.key === "risk_spectrum" ? (
                              <div>
                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                  {riskMap[String(fund.proj_id).trim()]
                                    ?.level ?? "ไม่พบข้อมูล"}
                                </span>
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  {riskMap[String(fund.proj_id).trim()]?.desc ??
                                    ""}
                                </p>
                              </div>
                            ) : row.key === "fund_status" ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusStyle(
                                  fund.fund_status
                                )}`}
                              >
                                {getFundValue(fund, row.key)}
                              </span>
                            ) : (
                              getFundValue(fund, row.key)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <p className="text-xs leading-5 text-slate-500">
                  หมายเหตุ: ตารางนี้แสดงข้อมูลพื้นฐานที่ได้รับจากแหล่งข้อมูลกองทุน
                  ควรตรวจสอบรายละเอียดและสถานะล่าสุดก่อนตัดสินใจลงทุน
                </p>
              </div>
            </section>
          </>
        )}

        {!loading && !error && funds.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-800">
              ↔
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              ยังไม่มีข้อมูลสำหรับเปรียบเทียบ
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              กลับไปเลือกรายการกองทุนอย่างน้อย 2 กองทุน
            </p>
            <a
              href="/"
              className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              กลับหน้ารายการกองทุน
            </a>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          Fund Compare · เครื่องมือช่วยเปรียบเทียบข้อมูลกองทุน
        </div>
      </footer>
    </main>
  );
}