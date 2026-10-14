"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type NavItem = {
  proj_id: string;
  fund_class_name: string | null;
  nav_date: string | null;
  last_val: number | null;
  net_asset: number | null;
};

type RangeKey = "1M" | "3M" | "6M" | "1Y";

const RANGES: { label: string; value: RangeKey; months: number }[] = [
  { label: "1 เดือน", value: "1M", months: 1 },
  { label: "3 เดือน", value: "3M", months: 3 },
  { label: "6 เดือน", value: "6M", months: 6 },
  { label: "1 ปี", value: "1Y", months: 12 },
];

function formatThaiDate(value: string | null): string {
  if (!value) return "ไม่มีข้อมูล";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${Number(match[1]) + 543}`;
}

function formatNav(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "ไม่มีข้อมูล";
  }

  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function FundNavHistoryChart({
  projId,
  fundClassName,
}: {
  projId: string;
  fundClassName: string | null;
}) {
  const [items, setItems] = useState<NavItem[]>([]);
  const [range, setRange] = useState<RangeKey>("3M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/fund-nav-history?proj_id=${encodeURIComponent(projId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("โหลดประวัติ NAV ไม่สำเร็จ");
        }

        const data: {
          message: string;
          items: NavItem[];
        } = await response.json();

        if (data.message !== "success") {
          throw new Error("API ไม่สามารถส่งประวัติ NAV ได้");
        }

        if (!cancelled) {
          setItems(data.items ?? []);
        }
      } catch (err) {
        console.error("NAV history error:", err);

        if (!cancelled) {
          setError("ไม่สามารถโหลดประวัติ NAV ได้ กรุณาลองใหม่");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [projId]);

  // กรองให้ตรงกับชนิดหน่วยลงทุนของกองทุนที่เปิดอยู่
  const classItems = useMemo(() => {
    if (!fundClassName) return [];

    return items
      .filter(
        (item) =>
          item.fund_class_name === fundClassName &&
          item.nav_date &&
          item.last_val != null &&
          Number.isFinite(item.last_val)
      )
      .sort((a, b) =>
        (a.nav_date ?? "").localeCompare(b.nav_date ?? "")
      );
  }, [items, fundClassName]);

  const filteredItems = useMemo(() => {
    const selectedRange = RANGES.find((item) => item.value === range);
    const months = selectedRange?.months ?? 3;

    const latestDate = classItems[classItems.length - 1]?.nav_date;

    if (!latestDate) return [];

    const endDate = new Date(`${latestDate}T00:00:00`);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months);

    const startText = [
      startDate.getFullYear(),
      String(startDate.getMonth() + 1).padStart(2, "0"),
      String(startDate.getDate()).padStart(2, "0"),
    ].join("-");

    return classItems.filter(
      (item) => (item.nav_date ?? "") >= startText
    );
  }, [classItems, range]);

  const chartData = useMemo(
    () =>
      filteredItems.map((item) => ({
        date: item.nav_date ?? "",
        dateLabel: formatThaiDate(item.nav_date),
        nav: item.last_val as number,
      })),
    [filteredItems]
  );

  
const returnChartData = useMemo(() => {
  if (filteredItems.length === 0) return [];

  const firstNav = filteredItems[0].last_val;

  if (firstNav == null || firstNav === 0) return [];

  return filteredItems
    .filter(
      (item) =>
        item.last_val != null &&
        Number.isFinite(item.last_val)
    )
    .map((item) => ({
      date: item.nav_date ?? "",
      dateLabel: formatThaiDate(item.nav_date),
      returnPercent:
        ((item.last_val! - firstNav) / firstNav) * 100,
    }));
}, [filteredItems]);


  const changePercent = useMemo(() => {
    if (filteredItems.length < 2) return null;

    const first = filteredItems[0].last_val;
    const last = filteredItems[filteredItems.length - 1].last_val;

    if (first == null || last == null || first === 0) return null;

    return ((last - first) / first) * 100;
  }, [filteredItems]);


  
const navSummary = useMemo(() => {
  if (filteredItems.length === 0) return null;

  const first = filteredItems[0];
  const last = filteredItems[filteredItems.length - 1];

  if (first.last_val == null || last.last_val == null) {
    return null;
  }

  return {
    firstNav: first.last_val,
    lastNav: last.last_val,
    changeValue: last.last_val - first.last_val,
    changePercent:
      first.last_val === 0
        ? null
        : ((last.last_val - first.last_val) / first.last_val) * 100,
    startDate: first.nav_date,
    endDate: last.nav_date,
    count: filteredItems.length,
  };
}, [filteredItems]);


  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">
            FUND PERFORMANCE
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            กราฟประวัติ NAV
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {fundClassName
              ? `ชนิดหน่วยลงทุน: ${fundClassName}`
              : "ไม่พบข้อมูลชนิดหน่วยลงทุน"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              aria-pressed={range === item.value}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                range === item.value
                  ? "bg-blue-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>


{!loading && !error && navSummary && (
  <div className="mt-6">
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <h3 className="text-lg font-bold text-slate-900">
        สรุปการเปลี่ยนแปลง NAV
      </h3>
      <p className="text-xs text-slate-500">
        {formatThaiDate(navSummary.startDate)} – {formatThaiDate(navSummary.endDate)}
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">NAV วันแรก</p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {formatNav(navSummary.firstNav)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">NAV ล่าสุด</p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {formatNav(navSummary.lastNav)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">เปลี่ยนแปลงต่อหน่วย</p>
        <p className={`mt-2 text-xl font-bold ${
          navSummary.changeValue > 0
            ? "text-emerald-700"
            : navSummary.changeValue < 0
              ? "text-red-600"
              : "text-slate-900"
        }`}>
          {navSummary.changeValue > 0 ? "+" : ""}
          {formatNav(navSummary.changeValue)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">เปลี่ยนแปลง (%)</p>
        <p className={`mt-2 text-xl font-bold ${
          navSummary.changePercent == null
            ? "text-slate-500"
            : navSummary.changePercent > 0
              ? "text-emerald-700"
              : navSummary.changePercent < 0
                ? "text-red-600"
                : "text-slate-900"
        }`}>
          {navSummary.changePercent == null
            ? "—"
            : `${navSummary.changePercent > 0 ? "+" : ""}${navSummary.changePercent.toFixed(2)}%`}
        </p>
      </div>
    </div>
  </div>
)}

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          กำลังโหลดประวัติ NAV...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-red-600">
          {error}
        </div>
      ) : !fundClassName ? (
        <div className="py-12 text-center text-sm text-slate-500">
          ไม่พบชนิดหน่วยลงทุนสำหรับใช้กรองประวัติ NAV
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          ไม่พบข้อมูล NAV ของชนิดหน่วยลงทุนนี้ในช่วงเวลาที่เลือก
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">NAV ล่าสุดในช่วงที่เลือก</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNav(filteredItems[filteredItems.length - 1].last_val)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatThaiDate(filteredItems[filteredItems.length - 1].nav_date)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">NAV แรกในช่วงที่เลือก</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNav(filteredItems[0].last_val)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatThaiDate(filteredItems[0].nav_date)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                การเปลี่ยนแปลงของ NAV
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  changePercent == null
                    ? "text-slate-700"
                    : changePercent > 0
                      ? "text-emerald-700"
                      : changePercent < 0
                        ? "text-red-600"
                        : "text-slate-700"
                }`}
              >
                {changePercent == null
                  ? "ข้อมูลไม่เพียงพอ"
                  : formatPercent(changePercent)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                คำนวณจาก NAV แรกถึง NAV ล่าสุดในช่วงที่เลือก
              </p>
            </div>
          </div>

          <div className="mt-6 h-72 w-full sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: number) => value.toFixed(2)}
                  width={55}
                />

                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.dateLabel ?? ""
                  }
                  formatter={(value) => [
                    formatNav(Number(value)),
                    "NAV",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="nav"
                  name="NAV"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          
<div className="mt-8">
  <h3 className="mb-1 text-lg font-bold text-slate-900">
    กราฟการเปลี่ยนแปลง NAV (%)
  </h3>

  <p className="mb-4 text-sm text-slate-500">
    เปรียบเทียบกับ NAV วันแรกในช่วงเวลาที่เลือก
  </p>

  {returnChartData.length < 2 ? (
    <div className="py-12 text-center text-sm text-slate-500">
      ข้อมูลไม่เพียงพอสำหรับสร้างกราฟ
    </div>
  ) : (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={returnChartData}
          margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            minTickGap={24}
          />

          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) =>
              `${value.toFixed(2)}%`
            }
            width={65}
          />

          <Tooltip
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.dateLabel ?? ""
            }
            formatter={(value) => [
              `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)}%`,
              "การเปลี่ยนแปลง NAV",
            ]}
          />

          <Line
            type="monotone"
            dataKey="returnPercent"
            name="การเปลี่ยนแปลง NAV"
            stroke="#0f766e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )}
</div>


          <p className="mt-2 text-xs text-slate-500">
            แสดง {filteredItems.length.toLocaleString("th-TH")} วันข้อมูล
            · ใช้ NAV ต่อหน่วยจาก API
          </p>

          <div className="mt-8">
            <h3 className="mb-3 font-bold text-slate-900">
              ตารางประวัติ NAV
            </h3>

            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      วันที่ NAV
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      NAV ต่อหน่วย
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      มูลค่าทรัพย์สินสุทธิ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[...filteredItems].reverse().map((item, index) => (
                    <tr
                      key={`${item.proj_id}-${item.fund_class_name}-${item.nav_date}`}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }
                    >
                      <td className="border-t border-slate-100 px-4 py-3">
                        {formatThaiDate(item.nav_date)}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right font-medium tabular-nums">
                        {formatNav(item.last_val)}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right tabular-nums">
                        {item.net_asset == null
                          ? "ไม่มีข้อมูล"
                          : new Intl.NumberFormat("th-TH", {
                              maximumFractionDigits: 2,
                            }).format(item.net_asset)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}