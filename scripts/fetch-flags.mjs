import { writeFileSync, createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// Split into two requests due to API field count limit
const API_URL_1 =
  "https://restcountries.com/v3.1/all?fields=name,translations,flags,region,subregion,capital,population,area,cca2";
const API_URL_2 =
  "https://restcountries.com/v3.1/all?fields=languages,currencies,cca2";
const FLAGS_DIR = new URL("../assets/flags/", import.meta.url).pathname;
const OUTPUT_PATH = new URL("../data/countries.json", import.meta.url).pathname;
const FLAG_WIDTH = 320;
const BATCH_SIZE = 5;

async function fetchCountries() {
  console.log("Fetching country data from REST Countries API...");
  const [res1, res2] = await Promise.all([fetch(API_URL_1), fetch(API_URL_2)]);
  if (!res1.ok) throw new Error(`API error (1): ${res1.status}`);
  if (!res2.ok) throw new Error(`API error (2): ${res2.status}`);
  const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

  // Merge by cca2
  const extraByCode = new Map(data2.map((d) => [d.cca2, d]));
  const merged = data1.map((d) => ({
    ...d,
    ...extraByCode.get(d.cca2),
  }));
  console.log(`Fetched ${merged.length} countries/territories.`);
  return merged;
}

function formatCurrency(currencies) {
  if (!currencies) return "";
  const first = Object.values(currencies)[0];
  if (!first) return "";
  return first.symbol ? `${first.name} (${first.symbol})` : first.name;
}

function transformCountry(raw) {
  const code = raw.cca2?.toLowerCase() || "";
  return {
    code,
    name_ko: raw.translations?.kor?.common || raw.name?.common || "",
    name_en: raw.name?.common || "",
    description: {
      capital: raw.capital?.[0] || "",
      population: raw.population || 0,
      area_km2: raw.area || 0,
      languages: raw.languages ? Object.values(raw.languages) : [],
      currency: formatCurrency(raw.currencies),
      subregion: raw.subregion || "",
    },
    flag_uri: `assets/flags/${code}.png`,
    continent: raw.region || "",
  };
}

async function downloadFlag(code, retries = 1) {
  const dest = `${FLAGS_DIR}${code}.png`;
  if (existsSync(dest)) return true;

  const url = `https://flagcdn.com/w${FLAG_WIDTH}/${code}.png`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`  Failed to download flag for ${code}: ${err.message}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

async function downloadFlagsInBatches(countries) {
  console.log(`\nDownloading ${countries.length} flag images...`);
  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < countries.length; i += BATCH_SIZE) {
    const batch = countries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((c) => downloadFlag(c.code))
    );
    results.forEach((ok) => (ok ? downloaded++ : failed++));
    process.stdout.write(
      `\r  Progress: ${downloaded + failed}/${countries.length} (${failed} failed)`
    );
  }

  console.log(
    `\n  Done: ${downloaded} downloaded, ${failed} failed.`
  );
  return failed;
}

async function main() {
  const raw = await fetchCountries();
  const countries = raw
    .map(transformCountry)
    .filter((c) => c.code)
    .sort((a, b) => a.name_ko.localeCompare(b.name_ko, "ko"));

  console.log(`\nProcessed ${countries.length} countries.`);

  // Download flag images
  const failCount = await downloadFlagsInBatches(countries);

  // Save JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(countries, null, 2), "utf-8");
  console.log(`\nSaved country data to ${OUTPUT_PATH}`);

  // Summary
  const noKorean = countries.filter((c) => !c.name_ko);
  const noCapital = countries.filter((c) => !c.description.capital);
  console.log(`\n--- Summary ---`);
  console.log(`Total countries: ${countries.length}`);
  console.log(`Missing Korean name: ${noKorean.length}`);
  console.log(`Missing capital: ${noCapital.length}`);
  console.log(`Failed flag downloads: ${failCount}`);
  if (noKorean.length > 0) {
    console.log(
      `  Without Korean name: ${noKorean.map((c) => c.code).join(", ")}`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
