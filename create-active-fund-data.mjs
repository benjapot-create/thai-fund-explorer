
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

const SOURCE_FILE = path.join(
  DATA_DIR,
  "fund-profiles.json"
);

const OUTPUT_FILE = path.join(
  DATA_DIR,
  "fund-profiles-active.json"
);

const ALLOWED_STATUSES = new Set([
  "Registered",
  "IPO",
]);

async function main() {
  // อ่านข้อมูลต้นฉบับเท่านั้น ไม่แก้ไขไฟล์นี้
  const raw = await readFile(SOURCE_FILE, "utf8");
  const funds = JSON.parse(raw);

  if (!Array.isArray(funds)) {
    throw new Error("ไฟล์ต้นฉบับต้องเป็น JSON array");
  }

  // เลือกเฉพาะสถานะที่ต้องการทดลอง
  const activeFunds = funds.filter(
    (fund) => ALLOWED_STATUSES.has(fund.fund_status)
  );

  // ตรวจสอบจำนวน proj_id ที่ไม่ซ้ำ
  const uniqueProjectIds = new Set(
    activeFunds
      .map((fund) => String(fund.proj_id ?? "").trim())
      .filter(Boolean)
  );

  // สร้างไฟล์แยก ไม่เขียนทับต้นฉบับ
  await mkdir(DATA_DIR, { recursive: true });

  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(activeFunds, null, 2),
    "utf8"
  );

  const counts = activeFunds.reduce((result, fund) => {
    const status = fund.fund_status ?? "(null)";
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {});

  console.log("สร้างไฟล์ทดลองสำเร็จ");
  console.log("ข้อมูลต้นฉบับทั้งหมด:", funds.length);
  console.log("ข้อมูลที่เลือก:", activeFunds.length);
  console.log("proj_id ที่ไม่ซ้ำ:", uniqueProjectIds.size);
  console.log("แยกตามสถานะ:", counts);
  console.log("ไฟล์ผลลัพธ์:", OUTPUT_FILE);
}

main().catch((error) => {
  console.error("สร้างไฟล์ไม่สำเร็จ:", error.message);
  process.exitCode = 1;
});
