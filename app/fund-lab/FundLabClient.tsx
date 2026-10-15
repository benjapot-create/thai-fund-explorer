"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFundRiskSpectrum,
  type FundRiskSpectrum,
} from "../../services/fund/fundRiskService";
import type { FundProfile } from "./page";
import parse, { domToReact } from "html-react-parser";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  funds: FundProfile[];
};

const POLICY_CATEGORIES = [
  { label: "หุ้น", pattern: /หุ้น|equity|equities|stock/i },
  { label: "ตราสารหนี้", pattern: /ตราสารหนี้|fixed.?income|bond/i },
  { label: "ตลาดเงิน", pattern: /ตลาดเงิน|money.?market/i },
  { label: "สินทรัพย์ผสม", pattern: /ผสม|ผสมผสาน|balanced|multi.?asset/i },
  { label: "อสังหาริมทรัพย์", pattern: /อสังหาริมทรัพย์|property|real.?estate|REIT/i },
  { label: "ทองคำและสินค้าโภคภัณฑ์", pattern: /ทองคำ|gold|commodity|commodities/i },
  { label: "กองทุนต่างประเทศ", pattern: /ต่างประเทศ|foreign|global|overseas|international/i },
  { label: "ดัชนี", pattern: /ดัชนี|index|passive|ETF/i },
  { label: "ESG / ความยั่งยืน", pattern: /ESG|ความยั่งยืน|sustainab|สิ่งแวดล้อม/i },
];

function getText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function displayValue(value: unknown): string {
  return getText(value) || "ไม่มีข้อมูล";
}

function formatDateTime(value: unknown): string {
  const text = getText(value);

  if (!text) return "ไม่มีข้อมูล";

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).format(date).replace(",", "") + " น.";
}

type FundNavItem = {
  proj_id: string;
  nav_date: string | null;
  last_val: number | null;
  net_asset: number | null;
};

type NavHistoryItem = {
  proj_id: string;
  fund_class_name?: string | null;
  nav_date: string | null;
  last_val: number | string | null;
};

type NavCompareFund = {
  id: string;
  name: string;
  className: string;
  startDate: string;
  endDate: string;
  startNav: number;
  endNav: number;
  changePercent: number;
  chart: { date: string; value: number }[];
};

type NavMultiPeriodFund = {
  id: string;
  name: string;
  className: string;
  changes: Record<NavCompareRange, number | null>;
};

type NavCompareRange = "1M" | "3M" | "6M" | "1Y";

const NAV_RANGE_OPTIONS: {
  value: NavCompareRange;
  label: string;
  months: number;
}[] = [
  { value: "1M", label: "1 เดือน", months: 1 },
  { value: "3M", label: "3 เดือน", months: 3 },
  { value: "6M", label: "6 เดือน", months: 6 },
  { value: "1Y", label: "1 ปี", months: 12 },
];

function toNavNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toDateStamp(value: string | null | undefined): number {
  if (!value) return Number.NaN;

  // ใช้เฉพาะวันที่ เพื่อป้องกันผลจาก timezone
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (match) {
    return Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "ไม่มีข้อมูล";
  }

  return `${value > 0 ? "+" : ""}${value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatNavValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "ไม่มีข้อมูล";
  }

  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatNavDate(value: string | null | undefined): string {
  if (!value) return "ไม่มีข้อมูล";

  // แปลงวันที่ YYYY-MM-DD โดยไม่ให้วันที่เลื่อนเพราะ timezone
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  const year = Number(match[1]) + 543;
  return `${match[3]}/${match[2]}/${year}`;
}

function stripHtml(value: unknown): string {
  return getText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPolicyHtml(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return <span className="text-slate-400">ไม่มีข้อมูล</span>;
  }

  return parse(value, {
    replace(node) {
      if (node.type !== "tag") return;

      const tag = node.name.toLowerCase();

      // ไม่แสดง script, style หรือเนื้อหาที่ไม่จำเป็น
      if (tag === "script" || tag === "style" || tag === "iframe") {
        return <></>;
      }

      const children = domToReact(node.children as never);

      if (tag === "table") {
        return (
          <div className="my-4 max-w-full overflow-x-auto rounded-lg">
            <table className="min-w-full border-collapse border border-slate-200 text-sm">
              {children}
            </table>
          </div>
        );
      }

      if (tag === "th") {
        return (
          <th className="border border-slate-200 bg-slate-100 p-3 text-left align-top font-semibold text-slate-800">
            {children}
          </th>
        );
      }

      if (tag === "td") {
        return (
          <td className="border border-slate-200 p-3 align-top text-slate-700">
            {children}
          </td>
        );
      }

      if (tag === "p") {
        return <p className="my-2 leading-7">{children}</p>;
      }

      if (tag === "li") {
        return <li className="ml-5 list-disc leading-7">{children}</li>;
      }

      if (tag === "ul" || tag === "ol") {
        return (
          <div className="my-3">
            {tag === "ul" ? (
              <ul className="list-disc">{children}</ul>
            ) : (
              <ol className="list-decimal">{children}</ol>
            )}
          </div>
        );
      }

      if (tag === "br") return <br />;

      if (
        [
          "figure",
          "tbody",
          "thead",
          "tfoot",
          "tr",
          "strong",
          "b",
          "em",
          "i",
        ].includes(tag)
      ) {
        return <>{children}</>;
      }

      // แท็กอื่นที่ไม่ได้กำหนดรูปแบบ ให้แสดงเฉพาะข้อความลูก
      if (
        [
          "div",
          "span",
          "section",
          "article",
          "font",
          "small",
          "u",
        ].includes(tag)
      ) {
        return <>{children}</>;
      }
    },
  });
}

function getPolicyText(fund: FundProfile): string {
  return [
    stripHtml(fund.policy_desc),
    stripHtml(fund.investment_policy_desc),
    stripHtml(fund.management_style),
  ]
    .filter(Boolean)
    .join(" ");
}

type NavCompareApiData = {
  factsheetJson: any;
  historyJson: any;
};

const navCompareApiCache = new Map<
  string,
  Promise<NavCompareApiData>
>();

function getNavCompareApiData(
  id: string
): Promise<NavCompareApiData> {
  const cached = navCompareApiCache.get(id);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const [factsheetResponse, historyResponse] =
      await Promise.all([
        fetch(
          `/api/fund-factsheet?proj_id=${encodeURIComponent(id)}`
        ),
        fetch(
          `/api/fund-nav-history?proj_id=${encodeURIComponent(id)}`
        ),
      ]);

 
async function readJsonResponse(
  response: Response,
  apiName: string
) {
  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `${apiName} failed: HTTP ${response.status}. ` +
      `Response: ${body.slice(0, 300)}`
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(
      `${apiName} returned non-JSON. ` +
      `URL: ${response.url}. ` +
      `Response: ${body.slice(0, 300)}`
    );
  }
}

const [factsheetJson, historyJson] = await Promise.all([
  readJsonResponse(factsheetResponse, "Fund factsheet API"),
  readJsonResponse(historyResponse, "Fund NAV history API"),
]);

return { factsheetJson, historyJson };

  })();

  navCompareApiCache.set(id, request);

  // หากโหลดไม่สำเร็จ ให้ลบ Cache เพื่อให้ลองใหม่ได้
  void request.catch(() => {
    if (navCompareApiCache.get(id) === request) {
      navCompareApiCache.delete(id);
    }
  });

  return request;
}

export default function FundLabClient({ funds }: Props) {
  const [keyword, setKeyword] = useState("");
  const [selectedAmc, setSelectedAmc] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedPolicies, setExpandedPolicies] = useState<string[]>([]);
  const [riskById, setRiskById] = useState<Record<string, FundRiskSpectrum>>({});
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [navById, setNavById] = useState<Record<string, FundNavItem>>({});
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState("");
  const [navCompareRange, setNavCompareRange] =useState<NavCompareRange>("3M");
  const [navCompareData, setNavCompareData] =useState<NavCompareFund[]>([]);
  const [navMultiPeriodData, setNavMultiPeriodData] =useState<NavMultiPeriodFund[]>([]);
  const [navCompareLoading, setNavCompareLoading] = useState(false);
  const [navCompareError, setNavCompareError] = useState("");
  
  // ประมวลผลคำอธิบายนโยบายไว้ล่วงหน้า ไม่ต้องแปลง HTML ซ้ำตอนค้นหา
  const policyData = useMemo(() => {
    return new Map(
      funds.map((fund) => {
        const id = getText(fund.proj_id);
        const text = getPolicyText(fund);

        const categories = POLICY_CATEGORIES
          .filter((category) => category.pattern.test(text))
          .map((category) => category.label);

        return [id, { text, categories }] as const;
      })
    );
  }, [funds]);


  // สร้างตัวเลือกบริษัทจากข้อมูลจริง
  const amcOptions = useMemo(() => {
    return Array.from(
      new Set(
        funds
          .map((fund) => getText(fund.comp_name_th))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "th"));
  }, [funds]);

  // สร้างตัวเลือกประเภทจากฟิลด์ที่มีอยู่ในข้อมูล
  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(
        funds
          .map((fund) => getText(fund.proj_retail_type))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "th"));
  }, [funds]);

  // แสดงเฉพาะหมวดนโยบายที่ตรวจพบในข้อมูลอย่างน้อยหนึ่งกองทุน

const policyOptions = useMemo(() => {
  const detected = new Set<string>();

  for (const item of policyData.values()) {
    for (const category of item.categories) {
      detected.add(category);
    }
  }

  return POLICY_CATEGORIES.filter((category) =>
    detected.has(category.label)
  );
}, [policyData]);


  const filteredFunds = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase();

    return funds
      .filter((fund) => {
        const matchesKeyword =
          !query ||
          [
            fund.proj_id,
            fund.proj_abbr_name,
            fund.proj_name_th,
            fund.proj_name_en,
            fund.comp_name_th,
          ].some((value) =>
            getText(value).toLocaleLowerCase().includes(query)
          );

        const matchesAmc =
          !selectedAmc || getText(fund.comp_name_th) === selectedAmc;

  
const matchesPolicy =
  !selectedPolicy ||
  (policyData.get(getText(fund.proj_id))?.categories.includes(
    selectedPolicy
  ) ?? false);


        const matchesType =
          !selectedType ||
          getText(fund.proj_retail_type) === selectedType;

        return (
          matchesKeyword &&
          matchesAmc &&
          matchesPolicy &&
          matchesType
        );
      })
      .slice(0, 100);
}, [funds, policyData, keyword, selectedAmc, selectedPolicy, selectedType]);

  const selectedFunds = useMemo(
    () =>
      selectedIds
        .map((id) => funds.find((fund) => getText(fund.proj_id) === id))
        .filter((fund): fund is FundProfile => Boolean(fund)),
    [funds, selectedIds]
  );


/* โหลดข้อมูล Risk Spectrum */

useEffect(() => {
  console.log("Risk useEffect started:", selectedIds);

  if (selectedIds.length === 0) {
    setRiskById({});
    setRiskLoading(false);
    setRiskError("");
    return;
  }

  let cancelled = false;

  async function loadRisk() {
    setRiskLoading(true);
    setRiskError("");

    try {
      const response = await getFundRiskSpectrum(selectedIds);

      if (cancelled) return;

      console.log("Risk response:", response.items);
      console.log("Selected IDs:", selectedIds);

      // เลือกเฉพาะรายการวันที่ล่าสุดของแต่ละกองทุน
      const latestById: typeof riskById = {};

      for (const item of response.items ?? []) {
        const id = item.proj_id?.trim();
        if (!id) continue;

        const itemTime = new Date(item.last_upd_date).getTime();
        if (!Number.isFinite(itemTime)) continue;

        const current = latestById[id];
        const currentTime = current
          ? new Date(current.last_upd_date).getTime()
          : Number.NaN;

        if (!current || !Number.isFinite(currentTime) || itemTime >= currentTime) {
          latestById[id] = item;
        }
      }

      if (!cancelled) {
        setRiskById((previous) => {
          const updated = { ...previous };

          // อัปเดตเฉพาะกองทุนที่เลือก โดยคงข้อมูลกองทุนอื่นไว้
          for (const id of selectedIds) {
            const normalizedId = id.trim();

            if (latestById[normalizedId]) {
              updated[normalizedId] = latestById[normalizedId];
            } else {
              delete updated[normalizedId];
            }
          }

          return updated;
        });
      }
    } catch (error) {
      console.error("โหลดข้อมูลความเสี่ยงไม่สำเร็จ:", error);

      if (!cancelled) {
        setRiskError("โหลดข้อมูลความเสี่ยงไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      if (!cancelled) {
        setRiskLoading(false);
      }
    }
  }

  void loadRisk();

  return () => {
    cancelled = true;
  };
}, [selectedIds]);


/*โหลด NAV ล่าสุด*/
useEffect(() => {
  if (selectedIds.length === 0) {
    setNavLoading(false);
    setNavError("");
    return;
  }

  let cancelled = false;

  async function loadNav() {
    setNavLoading(true);
    setNavError("");

    const results = await Promise.allSettled(
      selectedIds.map(async (id) => {
        const response = await fetch(
          `/api/fund-nav?proj_id=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          throw new Error(`โหลด NAV ของ ${id} ไม่สำเร็จ`);
        }

        const data: {
          message: string;
          item: FundNavItem | null;
        } = await response.json();

        if (data.message !== "success") {
          throw new Error(`API NAV ของ ${id} ส่งผลลัพธ์ไม่สำเร็จ`);
        }

        return { id, item: data.item };
      })
    );

    if (cancelled) return;

    const updated: Record<string, FundNavItem> = {};
    let failed = false;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      if (result.status === "fulfilled") {
        const { id, item } = result.value;

        if (item) {
          updated[id] = item;
        }
      } else {
        failed = true;
        console.error(
          `โหลด NAV ของ ${selectedIds[i]} ไม่สำเร็จ:`,
          result.reason
        );
      }
    }

    setNavById((previous) => {
      const next = { ...previous };

      // ล้างข้อมูลเก่าของกองทุนที่กำลังโหลดใหม่
      for (const id of selectedIds) {
        delete next[id];
      }

      return { ...next, ...updated };
    });

    if (failed) {
      setNavError("โหลด NAV บางกองทุนไม่สำเร็จ");
    }

    setNavLoading(false);
  }

  void loadNav().catch((error) => {
    console.error("โหลด NAV ไม่สำเร็จ:", error);

    if (!cancelled) {
      setNavError("โหลดข้อมูล NAV ไม่สำเร็จ กรุณาลองใหม่");
      setNavLoading(false);
    }
  });

  return () => {
    cancelled = true;
  };
}, [selectedIds]);

/*คำนวณผลเปรียบเทียบ NAV*/
useEffect(() => {
  let cancelled = false;

  async function loadNavComparison() {
    if (selectedIds.length === 0) {
      setNavCompareData([]);
      setNavCompareError("");
      setNavCompareLoading(false);
      return;
    }

    setNavCompareLoading(true);
    setNavCompareError("");
    setNavCompareData([]);

    try {
      const months =
        NAV_RANGE_OPTIONS.find(
          (option) => option.value === navCompareRange
        )?.months ?? 3;

      const responses = await Promise.all(
        selectedFunds.map(async (fund) => {
          const id = getText(fund.proj_id);

          if (!id) {
            throw new Error("ไม่พบรหัสกองทุน");
          }

          const { factsheetJson, historyJson } =
            await getNavCompareApiData(id);

          const factsheet =
            factsheetJson?.item ??
            factsheetJson?.factsheet ??
            factsheetJson?.data ??
            factsheetJson;

          const className = getText(
            factsheet?.fund_class_name ??
              factsheet?.fund_class ??
              factsheet?.share_class_name ??
              factsheet?.data?.fund_class_name ??
              factsheet?.item?.fund_class_name
          );

          if (!className) {
            throw new Error(
              `ไม่พบชนิดหน่วยลงทุนใน Factsheet ของ ${id}`
            );
          }

          const items: NavHistoryItem[] =
            Array.isArray(historyJson?.items)
              ? historyJson.items
              : [];

          const history = items
            .filter(
              (item) =>
                getText(item.fund_class_name) === className &&
                getText(item.nav_date) !== "" &&
                (toNavNumber(item.last_val) ?? 0) > 0
            )
            .map((item) => ({
              date: getText(item.nav_date).slice(0, 10),
              stamp: toDateStamp(item.nav_date),
              nav: Number(toNavNumber(item.last_val)),
            }))
            .filter((item) => Number.isFinite(item.stamp))
            .sort((a, b) => a.stamp - b.stamp);

          return {
            id,
            name: getText(fund.proj_name_th) || id,
            className,
            history,
          };
        })
      );

      if (cancelled) return;


      
const multiPeriodResults: NavMultiPeriodFund[] = [];

const fundsWithAnyHistory = responses.filter(
  (fund) => fund.history.length > 0
);

if (fundsWithAnyHistory.length > 0) {
  // ใช้วัน NAV ล่าสุดร่วมกัน เพื่อให้เปรียบเทียบวันสิ้นสุดเดียวกัน
  const multiPeriodEndStamp = Math.min(
    ...fundsWithAnyHistory.map(
      (fund) => fund.history[fund.history.length - 1].stamp
    )
  );

  for (const fund of responses) {
    const history = fund.history.filter(
      (item) => item.stamp <= multiPeriodEndStamp
    );

    const changes: Record<NavCompareRange, number | null> = {
      "1M": null,
      "3M": null,
      "6M": null,
      "1Y": null,
    };

    for (const option of NAV_RANGE_OPTIONS) {
      const startDate = new Date(multiPeriodEndStamp);
      startDate.setUTCMonth(
        startDate.getUTCMonth() - option.months
      );

      const baseline = [...history]
        .reverse()
        .find((item) => item.stamp <= startDate.getTime());

      const ending = history[history.length - 1];

      if (baseline && ending && baseline.nav > 0) {
        changes[option.value] =
          ((ending.nav - baseline.nav) / baseline.nav) * 100;
      }
    }

    multiPeriodResults.push({
      id: fund.id,
      name: fund.name,
      className: fund.className,
      changes,
    });
  }
}

multiPeriodResults.sort((a, b) => {
  const aValue = a.changes[navCompareRange];
  const bValue = b.changes[navCompareRange];

  if (aValue == null) return 1;
  if (bValue == null) return -1;
  return bValue - aValue;
});

if (cancelled) return;

setNavMultiPeriodData(multiPeriodResults);

      const fundsWithHistory = responses.filter(
        (fund) => fund.history.length > 0
      );

      if (fundsWithHistory.length === 0) {
        setNavCompareError(
          "ไม่พบประวัติ NAV ที่ตรงกับชนิดหน่วยลงทุน"
        );
        return;
      }

      // ใช้วัน NAV ล่าสุดร่วมกันของกองทุนที่มีประวัติ
      const commonEndStamp = Math.min(
        ...fundsWithHistory.map(
          (fund) => fund.history[fund.history.length - 1].stamp
        )
      );

      const startDate = new Date(commonEndStamp);
      startDate.setUTCMonth(
        startDate.getUTCMonth() - months
      );

      const startStamp = startDate.getTime();
      const results: NavCompareFund[] = [];

      for (const fund of responses) {
        const history = fund.history.filter(
          (item) => item.stamp <= commonEndStamp
        );

        if (history.length === 0) continue;

        // NAV ล่าสุด ณ วันเริ่มต้นหรือก่อนวันเริ่มต้น
        const baseline = [...history]
          .reverse()
          .find((item) => item.stamp <= startStamp);

        const ending = history[history.length - 1];

        if (!baseline || !ending || baseline.nav <= 0) {
          continue;
        }

        const changePercent =
          ((ending.nav - baseline.nav) / baseline.nav) * 100;

        const chart = history
          .filter(
            (item) =>
              item.stamp >= baseline.stamp &&
              item.stamp <= commonEndStamp
          )
          .map((item) => ({
            date: item.date,
            value:
              ((item.nav - baseline.nav) / baseline.nav) * 100,
          }));

        results.push({
          id: fund.id,
          name: fund.name,
          className: fund.className,
          startDate: baseline.date,
          endDate: ending.date,
          startNav: baseline.nav,
          endNav: ending.nav,
          changePercent,
          chart,
        });
      }

      results.sort(
        (a, b) => b.changePercent - a.changePercent
      );

      if (cancelled) return;

      setNavCompareData(results);

      if (results.length === 0) {
        setNavCompareError(
          "ข้อมูลย้อนหลังไม่เพียงพอสำหรับช่วงเวลาที่เลือก"
        );
      } else if (results.length < selectedIds.length) {
        setNavCompareError(
          "บางกองทุนมีข้อมูลย้อนหลังไม่เพียงพอ จึงไม่ถูกนำมาจัดอันดับ"
        );
      }
    } catch (error) {
      if (cancelled) return;

      console.error("เปรียบเทียบ NAV ไม่สำเร็จ:", error);

      setNavCompareData([]);
      setNavCompareError(
        error instanceof Error
          ? error.message
          : "โหลดข้อมูลเปรียบเทียบ NAV ไม่สำเร็จ"
      );
    } finally {
      if (!cancelled) {
        setNavCompareLoading(false);
      }
    }
  }

  void loadNavComparison();

  return () => {
    cancelled = true;
  };
}, [selectedIds, selectedFunds, navCompareRange]);

  const hasActiveFilters = Boolean(
  keyword.trim() || selectedAmc || selectedPolicy || selectedType
  );

  function resetFilters() {
    setKeyword("");
    setSelectedAmc("");
    setSelectedPolicy("");
    setSelectedType("");
  }

  function toggleFund(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, id];
    });
  }

  function togglePolicy(id: string) {
    setExpandedPolicies((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const comparisonFields: {
    label: string;
    key:
      | "proj_name_th"
      | "proj_name_en"
      | "proj_abbr_name"
      | "comp_name_th"
      | "fund_status"
      | "proj_retail_type"
      | "management_style"
      | "policy_desc"
      | "investment_policy_desc";
    isPolicy?: boolean;
  }[] = [
    { label: "ชื่อกองทุน (ไทย)", key: "proj_name_th" },
    { label: "ชื่อกองทุน (อังกฤษ)", key: "proj_name_en" },
    { label: "ชื่อย่อกองทุน", key: "proj_abbr_name" },
    { label: "บริษัทจัดการกองทุน", key: "comp_name_th" },
    { label: "สถานะกองทุน", key: "fund_status" },
    { label: "ประเภทผู้ลงทุน", key: "proj_retail_type" },
    { label: "รูปแบบการจัดการ", key: "management_style" },
    { label: "นโยบายการลงทุน", key: "policy_desc", isPolicy: true },
    {
      label: "รายละเอียดนโยบายการลงทุน",
      key: "investment_policy_desc",
      isPolicy: true,
    },
  ];


  const navCompareChartData = useMemo(() => {
  const byDate = new Map<
    string,
    Record<string, string | number | null>
  >();

  // รวมค่าของแต่ละกองทุนตามวันที่
  for (const fund of navCompareData) {
    for (const point of fund.chart) {
      const row = byDate.get(point.date) ?? {
        date: point.date,
      };

      row[fund.id] = point.value;
      byDate.set(point.date, row);
    }
  }

  // เรียงวันที่จากเก่าไปใหม่ และเติม null ในวันที่ไม่มี NAV
  const rows = Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  for (const row of rows) {
    for (const fund of navCompareData) {
      if (!(fund.id in row)) {
        row[fund.id] = null;
      }
    }
  }

  return rows;
  }, [navCompareData]);


  const navCompareColors = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#9333ea",
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ส่วนหัว */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] via-[#172554] to-[#1E40AF] p-5 text-white shadow-lg shadow-slate-900/10 sm:p-8">
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/[0.08]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-blue-400/[0.08] blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-medium tracking-wide text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              FUND RESEARCH WORKSPACE
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:mt-6 sm:text-4xl lg:text-5xl">
              เปรียบเทียบกองทุน
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base">
              ค้นหา กรอง และเปรียบเทียบข้อมูลกองทุนในหน้าเดียว
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[260px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-xs leading-5 text-slate-300">
                กองทุนทั้งหมด
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
                {funds.length.toLocaleString("th-TH")}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                รายการ
              </p>
            </div>

            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-4 backdrop-blur-sm">
              <p className="text-xs leading-5 text-emerald-100/80">
                เลือกเปรียบเทียบ
              </p>       
              <p className="mt-2 flex items-baseline gap-1.5 text-2xl font-extrabold tabular-nums tracking-tight text-emerald-300 sm:text-3xl">
              <span>{selectedIds.length}</span>
              <span className="text-2xl font-extrabold text-emerald-300 sm:text-3xl">
              / 4
              </span>
              </p>

              <div
                className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="จำนวนกองทุนที่เลือกเปรียบเทียบ"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={Math.min(selectedIds.length, 4)}
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(selectedIds.length / 4, 1) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* ค้นหาและตัวกรอง */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ค้นหาและกรองกองทุน
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                เลือกได้หลายเงื่อนไขเพื่อจำกัดผลการค้นหา
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="fund-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ค้นหาชื่อกองทุน ชื่อย่อ หรือรหัสกองทุน
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4" />
                  </svg>
                </span>
                <input
                  id="fund-search"
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="เช่น กองทุนหุ้นไทย หรือชื่อบริษัท..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="amc-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                บริษัทจัดการกองทุน (AMC)
              </label>
              <select
                id="amc-filter"
                value={selectedAmc}
                onChange={(event) => setSelectedAmc(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">ทุกบริษัท</option>
                {amcOptions.map((amc) => (
                  <option key={amc} value={amc}>
                    {amc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="policy-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                นโยบายการลงทุน
              </label>
              <select
                id="policy-filter"
                value={selectedPolicy}
                onChange={(event) => setSelectedPolicy(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">ทุกนโยบาย</option>
                {policyOptions.map((category) => (
                  <option key={category.label} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                จัดกลุ่มจากคำสำคัญในคำอธิบายนโยบายที่มีอยู่
              </p>
            </div>

            <div>
              <label
                htmlFor="type-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ประเภทผู้ลงทุนตามข้อมูลกองทุน
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">ทุกประเภท</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                ใช้ฟิลด์ proj_retail_type จากข้อมูลต้นฉบับ
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              พบ{" "}
              <span className="font-bold text-slate-900">
                {filteredFunds.length.toLocaleString("th-TH")}
              </span>{" "}
              กองทุนในรายการที่แสดง
            </p>
            <p className="text-xs text-slate-400">
              แสดงผลสูงสุด 100 รายการ
            </p>
          </div>
        </section>

        {/* รายการกองทุน */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                รายการกองทุน
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                เลือกกองทุนเพื่อเพิ่มลงในตารางเปรียบเทียบ
              </p>
            </div>
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              เลือกได้สูงสุด 4 กองทุน
            </span>
          </div>

          <div className="max-h-[520px] overflow-auto">
            {filteredFunds.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-semibold text-slate-700">
                  ไม่พบกองทุนที่ตรงกับเงื่อนไข
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  ลองเปลี่ยนคำค้นหาหรือกดล้างตัวกรอง
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFunds.map((fund) => {
                  const id = getText(fund.proj_id);
                  const isSelected = selectedIds.includes(id);
                  const isDisabled =
                    !isSelected && selectedIds.length >= 4;

                  return (
                    <div
                      key={id}
                      className={`flex items-start gap-3 px-5 py-4 transition ${
                        isSelected
                          ? "bg-blue-50/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleFund(id)}
                        aria-label={`เลือก ${displayValue(fund.proj_name_th)}`}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-blue-900 disabled:cursor-not-allowed"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {displayValue(fund.proj_name_th)}
                          </p>
                          {getText(fund.proj_abbr_name) && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {getText(fund.proj_abbr_name)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {displayValue(fund.proj_name_en)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            AMC: {displayValue(fund.comp_name_th)}
                          </span>
                          <span>
                            ประเภท: {displayValue(fund.proj_retail_type)}
                          </span>
                          <span>
                            สถานะ: {displayValue(fund.fund_status)}
                          </span>
                          <span>รหัส: {displayValue(fund.proj_id)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ตารางเปรียบเทียบ */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
         
<div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
  <div>
    <h2 className="text-lg font-bold text-slate-900">
      ตารางเปรียบเทียบกองทุน
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      เลือกอย่างน้อย 2 กองทุนจากรายการด้านบนเพื่อเริ่มเปรียบเทียบ
    </p>
  </div>

  {selectedIds.length > 0 && (
    <button
      type="button"
      onClick={() => {
        setSelectedIds([]);
        setExpandedPolicies([]);
      }}
      className="w-fit rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
    >
      ล้างรายการเปรียบเทียบ
    </button>
  )}
</div>


          {selectedFunds.length < 2 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M4 5h7v14H4zM13 5h7v14h-7z" />
                </svg>
              </div>
              <p className="mt-3 font-semibold text-slate-800">
                ยังเลือกกองทุนไม่ครบ
              </p>
              <p className="mt-1 text-sm text-slate-500">
                เลือกกองทุนอย่างน้อย 2 กองทุนเพื่อดูข้อมูลเทียบกัน
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
             
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
  <thead>
    <tr className="bg-slate-900 text-white">
      <th className="sticky left-0 z-20 w-52 min-w-52 border-b border-r border-slate-700 bg-slate-900 px-4 py-4 text-left font-semibold">
        รายการข้อมูล
      </th>

      {selectedFunds.map((fund) => (
        <th
          key={getText(fund.proj_id)}
          className="min-w-60 border-b border-slate-700 px-5 py-4 text-left align-top"
        >
          <div className="font-semibold leading-6">
            {displayValue(fund.proj_name_th)}
          </div>

          <a href={`/fund-lab/${encodeURIComponent(getText(fund.proj_id))}`}
            className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
          ดูรายละเอียดกองทุน ↗
          </a>

          <button
            type="button"
            onClick={() => toggleFund(getText(fund.proj_id))}
            className="mt-3 rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            นำออก
          </button>
        </th>
      ))}
    </tr>
  </thead>

  <tbody>
    {comparisonFields.map((field, index) => {
      const row = (
        <tr
          key={field.key}
          className={
            index % 2 === 0
              ? "bg-white hover:bg-blue-50/40"
              : "bg-slate-50 hover:bg-blue-50/40"
          }
        >
          <th
            className={`sticky left-0 z-10 w-52 min-w-52 border-b border-r border-slate-200 px-4 py-4 text-left align-top font-semibold text-slate-700 ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50"
            }`}
          >
            {field.label}
          </th>

          {selectedFunds.map((fund) => {
            const id = getText(fund.proj_id);
            const value = fund[field.key];
            const isExpanded = expandedPolicies.includes(
              `${id}-${field.key}`
            );
            const textValue = getText(value);
            const shouldCollapse =
              field.isPolicy && textValue.length > 500;

            return (
              <td
                key={`${id}-${field.key}`}
                className="border-b border-slate-200 px-5 py-4 align-top leading-7 text-slate-600"
              >
                {field.isPolicy ? (
                  <>
                    <div
                      className={
                        shouldCollapse && !isExpanded
                          ? "max-h-48 overflow-hidden"
                          : ""
                      }
                    >
                      {renderPolicyHtml(value)}
                    </div>

                    {shouldCollapse && (
                      <button
                        type="button"
                        onClick={() =>
                          togglePolicy(`${id}-${field.key}`)
                        }
                        className="mt-2 rounded-md px-2 py-1 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        {isExpanded ? "ย่อรายละเอียด" : "อ่านเพิ่มเติม"}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="whitespace-pre-wrap">
                    {displayValue(value)}
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      );

      if (field.key !== "proj_retail_type") {
        return row;
      }

      return [
  row,
  <tr
    key="nav-latest-row"
    className="bg-emerald-50/70"
  >
    <th className="sticky left-0 z-10 w-52 min-w-52 border-b border-r border-emerald-100 bg-emerald-50 px-4 py-4 text-left align-top font-semibold text-emerald-950">
      NAV ล่าสุด
    </th>

    {selectedFunds.map((fund) => {
      const id = getText(fund.proj_id);
      const nav = navById[id];

      return (
        <td
          key={`${id}-nav`}
          className="border-b border-emerald-100 px-5 py-4 align-top"
        >
          {navLoading && !nav ? (
            <span className="text-sm text-slate-500">
              กำลังโหลด NAV...
            </span>
          ) : nav ? (
            <div className="space-y-2">
              <p className="text-lg font-bold tabular-nums text-emerald-800">
                {formatNavValue(nav.last_val)}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                วันที่ NAV: {formatNavDate(nav.nav_date)}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                มูลค่าทรัพย์สินสุทธิ:{" "}
                {nav.net_asset == null
                  ? "ไม่มีข้อมูล"
                  : new Intl.NumberFormat("th-TH", {
                      maximumFractionDigits: 2,
                    }).format(nav.net_asset)}
              </p>
            </div>
          ) : (
            <span className="text-sm text-slate-500">
              {navError || "ไม่มีข้อมูล NAV"}
            </span>
          )}
        </td>
      );
    })}
  </tr>,
  
  <tr
    key="risk-spectrum-row"
    className="bg-amber-50/70"
  >
    <th className="sticky left-0 z-10 w-52 min-w-52 border-b border-r border-amber-100 bg-amber-50 px-4 py-4 text-left align-top font-semibold text-amber-950">
      ระดับความเสี่ยง
    </th>

    {selectedFunds.map((fund) => {
      const id = getText(fund.proj_id);
      const risk = riskById[id];

      return (
        <td
          key={`${id}-risk`}
          className="border-b border-amber-100 px-5 py-4 align-top"
        >
          {riskLoading && !risk ? (
            <span className="text-sm text-slate-500">
              กำลังโหลด Risk...
            </span>
          ) : risk ? (
            <div className="space-y-2">
              <p className="text-lg font-bold text-amber-800">
                {risk.risk_spectrum || "ไม่มีข้อมูล"}
              </p>

              <p className="text-sm leading-5 text-slate-700">
                {risk.risk_spectrum_desc || "ไม่มีคำอธิบายความเสี่ยง"}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                ประเภทหนังสือชี้ชวน: {risk.prospectus_type || "-"}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                วันที่ปรับปรุง: {formatDateTime(risk.last_upd_date)}
              </p>
            </div>
          ) : (
            <span className="text-sm text-slate-500">
              {riskError || "ไม่มีข้อมูล Risk"}
            </span>
          )}
        </td>
      );
    })}
  </tr>,

      ];
    })}
  </tbody>
          </table>

            </div>
          )}
        </section>
        
        {/* เปรียบเทียบการเปลี่ยนแปลง NAV */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                เปรียบเทียบการเปลี่ยนแปลง NAV
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                เปรียบเทียบ NAV ต่อหน่วยของกองทุนที่เลือก โดยใช้ช่วงเวลาเดียวกัน
                และกรองตามชนิดหน่วยลงทุนจาก Factsheet
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              ช่วงเวลาที่เปรียบเทียบ
              <select
                value={navCompareRange}
                onChange={(event) =>
                  setNavCompareRange(event.target.value as NavCompareRange)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {NAV_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p className="font-semibold">
              วิธีอ่านข้อมูล
            </p>
            <p className="mt-1">
              เปอร์เซ็นต์นี้คำนวณจากการเปลี่ยนแปลง NAV ต่อหน่วย
              ไม่รวมเงินปันผลและไม่ใช่ผลตอบแทนรวมของกองทุน
              ผลลัพธ์อาจต่างจากผลตอบแทนที่บริษัทจัดการกองทุนรายงาน
            </p>
          </div>

          {selectedFunds.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              เลือกกองทุนด้านบนเพื่อเปรียบเทียบการเปลี่ยนแปลง NAV
            </div>
          ) : navCompareLoading ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              กำลังโหลดประวัติ NAV และคำนวณผลเปรียบเทียบ...
            </div>
          ) : (
            <>
              {navCompareError && (
                <p
                  role="status"
                  className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                >
                  {navCompareError}
                </p>
              )}

              {navCompareData.length > 0 && (
                <>
                  <div className="mt-6">
                    <h3 className="mb-3 font-bold text-slate-900">
                      กราฟเปรียบเทียบ NAV (%)
                    </h3>

                    <div className="h-80 w-full rounded-xl border border-slate-100 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={navCompareChartData}
                          margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 10,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            minTickGap={24}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value: number) =>
                              `${value.toFixed(1)}%`
                            }
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              typeof value === "number"
                                ? `${value.toFixed(2)}%`
                                : "ไม่มีข้อมูล",
                              String(name),
                            ]}
                            labelFormatter={(label) => `วันที่ NAV: ${label}`}
                          />
                          <Legend />

                          {navCompareData.map((fund, index) => (
                            <Line
                              key={fund.id}
                              type="monotone"
                              dataKey={fund.id}
                              name={fund.name}
                              stroke={
                                navCompareColors[
                                  index % navCompareColors.length
                                ]
                              }
                              strokeWidth={2}
                              dot={false}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      กราฟแสดงเปอร์เซ็นต์การเปลี่ยนแปลงของ NAV ต่อหน่วย
                      เทียบกับ NAV ณ วันเริ่มต้นของแต่ละกองทุนในช่วงเวลาที่เลือก
                      เส้นกราฟอาจขาดช่วงได้เมื่อไม่มีข้อมูล NAV ในบางวัน
                      และไม่รวมเงินปันผล จึงไม่ใช่ผลตอบแทนรวมของกองทุน
                    </p>
                  </div>

                  <div className="mt-7">
                    <h3 className="mb-3 font-bold text-slate-900">
                      ตารางจัดอันดับการเปลี่ยนแปลง NAV
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left">อันดับ</th>
                            <th className="px-4 py-3 text-left">กองทุน</th>
                            <th className="px-4 py-3 text-left">ชนิดหน่วยลงทุน</th>
                            <th className="px-4 py-3 text-right">NAV ต้นช่วง</th>
                            <th className="px-4 py-3 text-right">NAV ล่าสุดในช่วง</th>
                            <th className="px-4 py-3 text-right">
                              เปลี่ยนแปลง (%)
                            </th>
                            <th className="px-4 py-3 text-left">วันที่ NAV ต้นช่วง</th>
                            <th className="px-4 py-3 text-left">วันที่ NAV ปลายช่วง</th>
                          </tr>
                        </thead>

                        <tbody>
                          {navCompareData.map((fund, index) => (
                            <tr
                              key={fund.id}
                              className={
                                index % 2 === 0
                                  ? "bg-white"
                                  : "bg-slate-50"
                              }
                            >
                              <td className="border-t border-slate-100 px-4 py-3 font-semibold">
                                {index + 1}
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3">
                                <p className="font-semibold text-slate-900">
                                  {fund.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {fund.id}
                                </p>
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3">
                                {fund.className}
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3 text-right tabular-nums">
                                {formatNavValue(fund.startNav)}
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3 text-right tabular-nums">
                                {formatNavValue(fund.endNav)}
                              </td>
                              <td
                                className={`border-t border-slate-100 px-4 py-3 text-right font-bold tabular-nums ${
                                  fund.changePercent > 0
                                    ? "text-emerald-700"
                                    : fund.changePercent < 0
                                      ? "text-red-700"
                                      : "text-slate-700"
                                }`}
                              >
                                {formatPercent(fund.changePercent)}
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">
                              {formatNavDate(fund.startDate)}
                              </td>
                              <td className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">
                              {formatNavDate(fund.endDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  
                  <div className="mt-7">
  <h3 className="mb-3 font-bold text-slate-900">
    เปรียบเทียบผลตอบแทนย้อนหลัง
  </h3>

  <p className="mb-3 text-sm text-slate-500">
    เปรียบเทียบผลตอบแทนจาก NAV โดยใช้วันสิ้นสุดร่วมกัน
  </p>

  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[760px] text-sm">
      <thead className="bg-slate-900 text-white">
        <tr>
          <th className="px-4 py-3 text-left">กองทุน</th>
          <th className="px-4 py-3 text-left">ชนิดหน่วยลงทุน</th>
          <th className="px-4 py-3 text-right">1 เดือน</th>
          <th className="px-4 py-3 text-right">3 เดือน</th>
          <th className="px-4 py-3 text-right">6 เดือน</th>
          <th className="px-4 py-3 text-right">1 ปี</th>
        </tr>
      </thead>

      <tbody>
        {navMultiPeriodData.map((fund, index) => (
          <tr
            key={fund.id}
            className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
          >
            <td className="border-t border-slate-100 px-4 py-3">
              <p className="font-semibold text-slate-900">
                {fund.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {fund.id}
              </p>
            </td>

            <td className="border-t border-slate-100 px-4 py-3">
              {fund.className}
            </td>

            {(["1M", "3M", "6M", "1Y"] as const).map((range) => {
              const value = fund.changes[range];

              return (
                <td
                  key={range}
                  className={`border-t border-slate-100 px-4 py-3 text-right font-bold tabular-nums ${
                    value == null
                      ? "text-slate-400"
                      : value > 0
                        ? "text-emerald-700"
                        : value < 0
                          ? "text-red-700"
                          : "text-slate-700"
                  }`}
                >
                  {value == null ? "ไม่มีข้อมูล" : formatPercent(value)}
                </td>
              );
            })}
          </tr>
        ))}

        {navMultiPeriodData.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="border-t border-slate-100 px-4 py-6 text-center text-slate-500"
            >
              เลือกกองทุนเพื่อดูผลตอบแทนย้อนหลัง
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
                  </div>

                </>
              )}
            </>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-6 text-slate-400">
          หน้าทดลองสำหรับค้นหาและเปรียบเทียบข้อมูลกองทุนเบื้องต้น
          การจัดกลุ่มนโยบายใช้คำสำคัญจากคำอธิบาย จึงควรตรวจสอบรายละเอียดของแต่ละกองทุนก่อนตัดสินใจลงทุน
        </p>
      </div>
    </main>
  );
}