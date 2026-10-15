
import {
  readFile,
  mkdir,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SOURCE_FILE = path.join(DATA_DIR, "fund-profiles.json");
const OUTPUT_FILE = path.join(DATA_DIR, "fund-profiles-active.json");
const TEMP_FILE = `${OUTPUT_FILE}.tmp`;

const ALLOWED_STATUSES = new Set(["Registered", "IPO"]);

async function main() {
  const raw = await readFile(SOURCE_FILE, "utf8");
  const funds = JSON.parse(raw);

  if (!Array.isArray(funds)) {
    throw new Error("ไฟล์ต้นฉบับต้องเป็น JSON array");
  }

  const activeFunds = funds.filter(
    (fund) => ALLOWED_STATUSES.has(fund.fund_status)
  );

  if (activeFunds.length === 0) {
    throw new Error(
      "ไม่พบข้อมูล Registered หรือ IPO จะไม่เขียนทับไฟล์เดิม"
    );
  }

  const invalid = activeFunds.some(
    (fund) => !String(fund.proj_id ?? "").trim()
  );

  if (invalid) {
    throw new Error(
      "พบรายการที่ไม่มี proj_id กรุณาตรวจสอบข้อมูลก่อน"
    );
  }

  await mkdir(DATA_DIR, { recursive: true });

  try {
    await writeFile(
      TEMP_FILE,
      JSON.stringify(activeFunds, null, 2),
      "utf8"
    );

    const check = JSON.parse(
      await readFile(TEMP_FILE, "utf8")
    );

    if (
      !Array.isArray(check) ||
      check.length !== activeFunds.length ||
      check.some(
        (fund) => !ALLOWED_STATUSES.has(fund.fund_status)
      )
    ) {
      throw new Error("ตรวจสอบไฟล์ผลลัพธ์ไม่ผ่าน");
    }

    await rename(TEMP_FILE, OUTPUT_FILE);
  } catch (error) {
    await unlink(TEMP_FILE).catch(() => {});
    throw error;
  }

  const counts = activeFunds.reduce((result, fund) => {
    result[fund.fund_status] =
      (result[fund.fund_status] || 0) + 1;
    return result;
  }, {});

  console.log("\nสร้างไฟล์ข้อมูลสำเร็จ");
  console.log("ข้อมูลต้นฉบับทั้งหมด:", funds.length);
  console.log("ข้อมูลที่เลือก:", activeFunds.length);
  console.log("แยกตามสถานะ:", counts);
  console.log("ไฟล์ผลลัพธ์:", OUTPUT_FILE);
}

main().catch((error) => {
  console.error("สร้างไฟล์ไม่สำเร็จ:", error.message);
  process.exitCode = 1;
});
