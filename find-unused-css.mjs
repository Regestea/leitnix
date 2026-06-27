import { PurgeCSS } from "purgecss";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { glob } from "glob";

const result = await new PurgeCSS().purge({
  content: ["./src/**/*.tsx"],
  css: ["./src/**/*.css"],
});

mkdirSync("purged", { recursive: true });

for (const { file, css } of result) {
  const filename = file.split("/").pop();
  writeFileSync(`purged/${filename}`, css);
  console.log(`✓ ${filename}`);
}