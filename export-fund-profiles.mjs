
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SEC_BASE_URL = "https://api.sec.or.th";

async function loadApiKey() {
  // อ่าน .env.local โดยไม่ต้องติดตั้งแพ็กเกจเพิ่ม
  const envText = await readFile(".env.local", "utf8");
  const match = envText.match(/^SEC_API_KEY\s*=\s*(.+)$/m);

  if (!match) {
    throw new Error("ไม่พบ SEC_API_KEY ใน .env.local");
  }

  return match[1].trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const apiKey = await loadApiKey();
  const allItems = [];
  const seenIds = new Set();
  let cursor;
  let page = 0;

  do {
    const url = new URL(
      "/v2/fund/general-info/profiles",
      SEC_BASE_URL
    );

    if (cursor) {
      url.searchParams.set("next_cursor", cursor);
    }

    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 204) {
      console.log("SEC ส่งสถานะ 204: ไม่มีข้อมูลเพิ่มเติม");
      break;
    }

    if (!response.ok) {
      throw new Error(
        `SEC API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    page++;

    for (const item of items) {
      const id = item.proj_id
  ? String(item.proj_id).trim()
  : "";

if (id && seenIds.has(id)) continue;

if (id) {
  seenIds.add(id);
}

allItems.push(item);
    }

    cursor = data.next_cursor || undefined;

    console.log(
      `หน้า ${page}: ได้ ${items.length} รายการ | รวม ${allItems.length} รายการ`
    );
  } while (cursor);

  const outputDir = path.join("data");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "fund-profiles.json");

  await writeFile(
    outputPath,
    JSON.stringify(allItems, null, 2),
    "utf8"
  );

  console.log(`\nExport สำเร็จ: ${outputPath}`);
  console.log(`จำนวนรายการที่บันทึก: ${allItems.length}`);
}

main().catch((error) => {
  console.error("Export ไม่สำเร็จ:", error.message);
  process.exitCode = 1;
});
