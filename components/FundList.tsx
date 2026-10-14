"use client";

import { useMemo, useState } from "react";
import FundCard from "./FundCard";
import SearchBox from "./SearchBox";

type Props = {
  funds: any[];
  nextCursor?: string;
};

function getFundKey(fund: any): string {
  return String(
    fund.fund_class_isin_code ||
    `${fund.proj_id}__${fund.fund_class_name || ""}`
  ).trim();
}

export default function FundList({
  funds: initialFunds,
  nextCursor: initialCursor,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedFunds, setSelectedFunds] = useState<any[]>([]);
  const [funds, setFunds] = useState(initialFunds);
  const totalFunds = funds.length;
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  function toggleFund(fund: any) {
  const fundKey = getFundKey(fund);

  const exists = selectedFunds.some(
    (item) => getFundKey(item) === fundKey
  );

  if (exists) {
    setSelectedFunds((prev) =>
      prev.filter((item) => getFundKey(item) !== fundKey)
    );
  } else {
    setSelectedFunds((prev) => [...prev, fund]);
  }
}

  const filteredFunds = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return funds;

    return funds.filter((fund) =>
      [
        fund.proj_abbr_name,
        fund.proj_name_th,
        fund.comp_name_th,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      )
    );
  }, [search, funds]);

  async function loadMore() {
    if (!cursor || loading) return;

    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(
        `/api/funds?cursor=${encodeURIComponent(cursor)}`
      );


if (!response.ok) {
  const errorBody = await response.text();

  const details =
    `HTTP Status: ${response.status}\n` +
    `Status Text: ${response.statusText}\n` +
    `Response Body: ${errorBody}`;

  console.error(details);
  alert(details);

  throw new Error(
    `ไม่สามารถโหลดข้อมูลกองทุนได้ (HTTP ${response.status})`
  );
}
      const data = await response.json();
      const newFunds = Array.isArray(data.items) ? data.items : [];
      console.log("จำนวนกองทุนเดิม:", funds.length);
      console.log("จำนวนกองทุนที่โหลดมา:", newFunds.length);
      console.log(
  "จำนวนกองทุนใหม่ที่ไม่ซ้ำ:",
  newFunds.filter(
    (fund: any) =>
      !funds.some(
        (oldFund) => getFundKey(oldFund) === getFundKey(fund)
      )
  ).length
);

      setFunds((prev) => {
      const existingIds = new Set(prev.map(getFundKey));

      return [
      ...prev,
      ...newFunds.filter(
      (fund: any) => !existingIds.has(getFundKey(fund))
      ),
      ];
      });

      setCursor(data.next_cursor || "");
    } catch (error) {
      console.error(error);
      setLoadError("โหลดกองทุนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }


function goToCompare() {
  if (selectedFunds.length < 2) return;

  try {
    sessionStorage.setItem(
      "fundCompareSelection",
      JSON.stringify(selectedFunds)
    );

    window.location.href = "/funds/compare";
  } catch (error) {
    console.error("Save compare selection failed:", error);
    alert("ไม่สามารถส่งข้อมูลกองทุนไปหน้า Compare ได้ กรุณาลองใหม่");
  }
}

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            FUND COMPARE
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ค้นหากองทุนที่ใช่
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            ค้นหากองทุนที่สนใจ เลือกกองทุนที่ต้องการ
            แล้วเปรียบเทียบข้อมูลเพื่อประกอบการตัดสินใจ
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-200">กองทุนที่แสดง</p>
              <p className="mt-1 text-xl font-bold">
                {funds.length.toLocaleString("th-TH")}
                <span className="ml-1 text-sm font-normal text-blue-200">
                  กองทุน
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-200">เลือกเปรียบเทียบแล้ว</p>
              <p className="mt-1 text-xl font-bold">
                {selectedFunds.length}
                <span className="ml-1 text-sm font-normal text-blue-200">
                  กองทุน
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-800">
            ค้นหากองทุน
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ค้นหาด้วยชื่อย่อ ชื่อกองทุน หรือบริษัทจัดการกองทุน
          </p>
        </div>

        <SearchBox value={search} onChange={setSearch} />
      </section>

      {/* Comparison selection panel */}
      <section
        className={`rounded-2xl border p-4 shadow-sm transition-colors sm:p-5 ${
          selectedFunds.length >= 2
            ? "border-blue-200 bg-blue-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                selectedFunds.length >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="3.5" y="4" width="7" height="16" rx="1.5" />
                <rect x="13.5" y="4" width="7" height="16" rx="1.5" />
                <path d="M5.5 8h3M5.5 11h3M15.5 8h3M15.5 11h3" />
              </svg>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                เปรียบเทียบกองทุน
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {selectedFunds.length === 0
                  ? "เลือกกองทุนที่สนใจอย่างน้อย 2 กองทุน"
                  : selectedFunds.length === 1
                    ? "เลือกเพิ่มอีก 1 กองทุนเพื่อเริ่มเปรียบเทียบ"
                    : `คุณเลือกไว้แล้ว ${selectedFunds.length} กองทุน พร้อมเปรียบเทียบ`}
              </p>

              {selectedFunds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedFunds.map((fund, index) => (
                    <span
                      key={`${fund.proj_id}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {fund.proj_abbr_name || fund.proj_name_th || fund.proj_id}

                      <button
                        type="button"
                        onClick={() => toggleFund(fund)}
                        aria-label={`นำ ${
                          fund.proj_abbr_name || fund.proj_name_th || fund.proj_id
                        } ออกจากรายการเปรียบเทียบ`}
                        className="rounded-full px-1 text-blue-500 hover:bg-blue-100 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={selectedFunds.length < 2}
            onClick={goToCompare}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            เปรียบเทียบเลย
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Results heading */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              รายการกองทุน
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {search.trim()
                ? `ผลการค้นหา “${search.trim()}”`
                : "เลือกกองทุนที่สนใจเพื่อดูข้อมูลเปรียบเทียบ"}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
            พบ {filteredFunds.length.toLocaleString("th-TH")} กองทุน
          </span>
        </div>

        {filteredFunds.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredFunds.map((fund, index) => (
              <FundCard
                key={`${fund.proj_id}-${fund.fund_class_name ?? index}`}
                fund={fund}
                selected={selectedFunds.some(
                (item) => getFundKey(item) === getFundKey(fund)
                )}
                onToggle={toggleFund}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              ไม่พบกองทุนที่ค้นหา
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              ลองค้นหาด้วยชื่อย่อ ชื่อกองทุน หรือชื่อบริษัทจัดการกองทุนอื่น
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        )}
      </section>

      {/* Load more */}
      {cursor && (
        <div className="flex flex-col items-center gap-3 pt-2">
          {loadError && (
            <p role="alert" className="text-sm text-red-600">
              {loadError}
            </p>
          )}

          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                กำลังโหลดข้อมูล...
              </>
            ) : (
              <>
                โหลดกองทุนเพิ่มเติม
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
