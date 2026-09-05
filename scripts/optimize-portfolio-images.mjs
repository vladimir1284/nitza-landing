#!/usr/bin/env node
// Resizes + converts raw portfolio project photos to webp for src/assets/images/portfolio/<slug>/.
// Usage: node scripts/optimize-portfolio-images.mjs <slug> [--src <dir>] [--cover <filename>]

import { readdir, mkdir } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import sharp from "sharp";

const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".avif", ".heic"]);
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

function parseArgs(argv) {
  const [slug, ...rest] = argv;
  if (!slug) {
    console.error("Usage: node scripts/optimize-portfolio-images.mjs <slug> [--src <dir>] [--cover <filename>]");
    process.exit(1);
  }
  let srcDir = join("content-staging", "portfolio", slug);
  let cover;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--src") srcDir = rest[++i];
    else if (rest[i] === "--cover") cover = rest[++i];
  }
  return { slug, srcDir, cover };
}

async function main() {
  const { slug, srcDir, cover } = parseArgs(process.argv.slice(2));
  const outDir = join("src", "assets", "images", "portfolio", slug);

  const entries = (await readdir(srcDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && SUPPORTED_EXT.has(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (entries.length === 0) {
    console.error(`No images found in ${srcDir}`);
    process.exit(1);
  }

  let ordered = entries;
  if (cover) {
    const coverName = entries.find((name) => name === cover || basename(name) === cover);
    if (!coverName) {
      console.error(`--cover "${cover}" not found among: ${entries.join(", ")}`);
      process.exit(1);
    }
    ordered = [coverName, ...entries.filter((name) => name !== coverName)];
  }

  await mkdir(outDir, { recursive: true });

  const written = [];
  for (let i = 0; i < ordered.length; i++) {
    const inputPath = join(srcDir, ordered[i]);
    const outputName = i === 0 ? "cover.webp" : `${i + 1}.webp`;
    const outputPath = join(outDir, outputName);

    await sharp(inputPath)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    written.push(outputPath);
    console.log(`${ordered[i]} -> ${outputPath}`);
  }

  console.log(`\nDone. ${written.length} image(s) written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
