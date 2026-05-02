#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT_DIR = process.cwd()
const SRC_DIR = path.join(ROOT_DIR, "src")
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".expo",
  "dist",
  "build",
  "coverage",
  ".cache",
])
const SCROLL_VIEW_REGEX = /<ScrollView\b/g
const MAP_REGEX = /\{[\s\S]{0,800}\.map\(/g

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (!ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
      continue
    }

    files.push(fullPath)
  }

  return files
}

async function main() {
  const files = await walk(SRC_DIR)
  const findings = []

  for (const file of files) {
    const source = await fs.readFile(file, "utf8")
    if (!SCROLL_VIEW_REGEX.test(source)) {
      SCROLL_VIEW_REGEX.lastIndex = 0
      continue
    }

    SCROLL_VIEW_REGEX.lastIndex = 0
    if (!MAP_REGEX.test(source)) {
      MAP_REGEX.lastIndex = 0
      continue
    }

    MAP_REGEX.lastIndex = 0
    findings.push(path.relative(ROOT_DIR, file))
  }

  if (findings.length === 0) {
    console.log("OK audit-scroll-map: no ScrollView + map pattern found")
    return
  }

  console.warn("WARN audit-scroll-map: review dynamic ScrollView rendering")
  for (const finding of findings) {
    console.warn(`- ${finding}`)
  }
}

main().catch((error) => {
  console.error("FAIL audit-scroll-map: unexpected error")
  console.error(error)
  process.exitCode = 1
})
