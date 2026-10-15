
import {
  readFile,
  mkdir,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

const SEC_BASE_URL = "https://api.sec.or.th";
const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_FILE = path.join(DATA_DIR, "fund-profiles.json");
const TEMP_FILE = `${OUTPUT_FILE}.tmp`;

const ALLOWED_STATUSES = ["Registered", "IPO"];

async function loadApiKey() {
  const envKey = process.env.SEC_API_KEY?.trim();

  if (envKey) {
    return envKey.replace(/^["']|["']$/g, "");
  }

  let envText;

  try {
    envText = await readFile(".env.local", "utf8");
  } catch {
    throw new Error(
      "ไม่พบ SEC_API_KEY ใน environment variable หรือ .env.local"
    );
  }

  const match = envText.match(
    /^\s*SEC_API_KEY\s*=\s*(.*?)\s*$/m
  );

  if (!match || !match[1]) {
    throw new Error("ไม่พบ SEC_API_KEY ใน .env.local");
  }

  return match[1].replace(/^["']|["']$/g, "");
}

async function fetchByStatus(apiKey, status) {
  const items = [];
  const seenCursors = new Set();
  let cursor;
  let page = 0;

  do {
    const url = new URL(
      "/v2/fund/general-info/profiles",
      SEC_BASE_URL
    );

    url.searchParams.set("fund_status", status);
    url.searchParams.set("page_size", "100");

    if (cursor) {
      url.searchParams.set("next_cursor", cursor);
    }

    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });

    if (response.status === 204) {
      console.log(`${status}: ไม่มีข้อมูลเพิ่มเติม`);
      break;
    }

    if (!response.ok) {
      throw new Error(
        `${status}: SEC API Error ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.items)) {
      throw new Error(
        `${status}: response ไม่ถูกต้อง หรือไม่มี items array`
      );
    }

    // ตรวจสอบว่าข้อมูลตรงกับสถานะที่ร้องขอจริง
    const wrongStatus = data.items.find(
      (item) => item.fund_status !== status
    );

    if (wrongStatus) {
      throw new Error(
        `${status}: API ส่งข้อมูลสถานะอื่นกลับมา กรุณาตรวจสอบตัวกรอง`
      );
    }

    page++;
    items.push(...data.items);

    console.log(
      `${status} หน้า ${page}: ได้ ${data.items.length} รายการ | รวม ${items.length} รายการ`
    );

    const nextCursor = data.next_cursor || undefined;

    if (nextCursor && seenCursors.has(nextCursor)) {
      throw new Error(
        `${status}: พบ next_cursor ซ้ำ หยุดเพื่อป้องกันการวนซ้ำ`
      );
    }

    if (nextCursor) {
      seenCursors.add(nextCursor);
    }

    cursor = nextCursor;
  } while (cursor);

  return items;
}

async function main() {
  const apiKey = await loadApiKey();
  const allItems = [];

  for (const status of ALLOWED_STATUSES) {
    const items = await fetchByStatus(apiKey, status);

    if (items.length === 0) {
      throw new Error(
        `ไม่พบข้อมูลสถานะ ${status} จะไม่เขียนทับไฟล์เดิม`
      );
    }

    allItems.push(...items);
  }

  const validIdCount = allItems.filter(
    (item) => String(item.proj_id ?? "").trim() !== ""
  ).length;

  if (allItems.length === 0 || validIdCount === 0) {
    throw new Error(
      "ข้อมูลไม่ครบหรือไม่มี proj_id ที่ใช้งานได้ จะไม่เขียนทับไฟล์เดิม"
    );
  }

  await mkdir(DATA_DIR, { recursive: true });

  try {
    await writeFile(
      TEMP_FILE,
      JSON.stringify(allItems, null, 2),
      "utf8"
    );

    const written = JSON.parse(
      await readFile(TEMP_FILE, "utf8")
    );

    if (
      !Array.isArray(written) ||
      written.length !== allItems.length ||
      written.some(
        (item) => !ALLOWED_STATUSES.includes(item.fund_status)
      )
    ) {
      throw new Error("ตรวจสอบไฟล์ชั่วคราวไม่ผ่าน");
    }

    await rename(TEMP_FILE, OUTPUT_FILE);
  } catch (error) {
    await unlink(TEMP_FILE).catch(() => {});
    throw error;
  }

  const statusCounts = allItems.reduce((counts, item) => {
    counts[item.fund_status] =
      (counts[item.fund_status] || 0) + 1;
    return counts;
  }, {});

  console.log("\nExport สำเร็จ");
  console.log("จำนวนรายการทั้งหมด:", allItems.length);
  console.log("รายการที่มี proj_id:", validIdCount);
  console.log("จำนวนตามสถานะ:", statusCounts);
  console.log("ไฟล์ผลลัพธ์:", OUTPUT_FILE);
}

main().catch((error) => {
  console.error("Export ไม่สำเร็จ:", error.message);
  process.exitCode = 1;
});
