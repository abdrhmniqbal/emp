#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT_DIR = process.cwd()
const SRC_DIR = path.join(ROOT_DIR, "src")
const MAX_LINES = 500
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
    const lineCount = source.split("\n").length
    if (lineCount > MAX_LINES) {
      findings.push({
        file: path.relative(ROOT_DIR, file),
        lineCount,
      })
    }
  }

  findings.sort((left, right) => right.lineCount - left.lineCount)

  if (findings.length === 0) {
    console.log(`OK audit-large-files: no files over ${MAX_LINES} lines`)
    return
  }

  console.warn(`WARN audit-large-files: files over ${MAX_LINES} lines`)
  for (const finding of findings) {
    console.warn(`- ${finding.file}: ${finding.lineCount} lines`)
  }
}

main().catch((error) => {
  console.error("FAIL audit-large-files: unexpected error")
  console.error(error)
  process.exitCode = 1
})
