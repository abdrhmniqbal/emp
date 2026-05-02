#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT_DIR = process.cwd()
const SRC_DIR = path.join(ROOT_DIR, "src")
const EFFECT_REGEX = /\b(useEffect|useLayoutEffect|useInsertionEffect)\b/g
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

function getLineNumber(source, index) {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1
    }
  }
  return line
}

async function main() {
  const files = await walk(SRC_DIR)
  const findings = []

  for (const file of files) {
    const source = await fs.readFile(file, "utf8")
    const matches = source.matchAll(EFFECT_REGEX)

    for (const match of matches) {
      findings.push({
        file: path.relative(ROOT_DIR, file),
        line: getLineNumber(source, match.index ?? 0),
        hook: match[1],
      })
    }
  }

  if (findings.length === 0) {
    console.log("OK audit-effects: no effect hooks in src")
    return
  }

  console.error("FAIL audit-effects: effect hooks found")
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} -> ${finding.hook}`)
  }

  process.exitCode = 1
}

main().catch((error) => {
  console.error("FAIL audit-effects: unexpected error")
  console.error(error)
  process.exitCode = 1
})
