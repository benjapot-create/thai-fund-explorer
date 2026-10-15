
const fs = require("node:fs");
const path = require("node:path");

const source = "data/fund-profiles-active.json";
const output = "data/fund-profiles-active-index.json";

const funds = JSON.parse(fs.readFileSync(source, "utf8"));

const fields = [
  "proj_id",
  "proj_name_th",
  "proj_name_en",
  "proj_abbr_name",
  "comp_name_th",
  "fund_status",
  "policy_desc",
  "investment_policy_desc",
  "management_style",
  "init_date",
  "regis_date",
  "cancel_date",
  "proj_retail_type",
  "proj_term_flag",
  "proj_term_day",
  "proj_term_month",
  "proj_term_year",
];

function cleanDescription(value, maxLength = 1200) {
  if (typeof value !== "string") return value;

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

const result = funds.map((fund) => {
  const item = {};

  for (const field of fields) {
    if (fund[field] === undefined) continue;

    if (field === "investment_policy_desc") {
      item[field] = cleanDescription(fund[field], 1200);
    } else if (field === "policy_desc") {
      item[field] = cleanDescription(fund[field], 500);
    } else {
      item[field] = fund[field];
    }
  }

  return item;
});

fs.mkdirSync(path.dirname(output), { recursive: true });

fs.writeFileSync(output, JSON.stringify(result), "utf8");

const oldSize = fs.statSync(source).size / 1024 / 1024;
const newSize = fs.statSync(output).size / 1024 / 1024;

console.log("จำนวนกองทุน:", result.length);
console.log("ไฟล์ต้นฉบับ:", oldSize.toFixed(2), "MB");
console.log("ไฟล์รายการใหม่:", newSize.toFixed(2), "MB");
console.log(
  "ลดขนาดลง:",
  ((1 - newSize / oldSize) * 100).toFixed(1),
  "%"
);
console.log("สร้างไฟล์สำเร็จ:", output);
