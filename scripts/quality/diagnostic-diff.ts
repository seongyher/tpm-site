import { readFile } from "node:fs/promises";

/** A normalized diagnostic emitted by a QA command or adapter. */
export interface DiagnosticRecord {
  code: string;
  count?: number;
  file?: string;
  message: string;
  route?: string;
  severity: string;
  tool: string;
}

/** One diagnostic difference between two normalized diagnostic sets. */
export interface DiagnosticDelta {
  actualCount: number;
  expectedCount: number;
  record: DiagnosticRecord;
}

/** Comparison result for two diagnostic snapshots. */
export interface DiagnosticDiffResult {
  added: DiagnosticDelta[];
  countChanged: DiagnosticDelta[];
  missing: DiagnosticDelta[];
}

interface DiagnosticBucket {
  count: number;
  record: DiagnosticRecord;
}

/**
 * Compares expected and actual diagnostic snapshots.
 *
 * @param expected Baseline diagnostics.
 * @param actual Candidate diagnostics.
 * @returns Structured differences between the snapshots.
 */
export function compareDiagnostics(
  expected: readonly DiagnosticRecord[],
  actual: readonly DiagnosticRecord[],
): DiagnosticDiffResult {
  const expectedBuckets = diagnosticBuckets(expected);
  const actualBuckets = diagnosticBuckets(actual);
  const added: DiagnosticDelta[] = [];
  const countChanged: DiagnosticDelta[] = [];
  const missing: DiagnosticDelta[] = [];
  const keys = new Set([...expectedBuckets.keys(), ...actualBuckets.keys()]);

  for (const key of Array.from(keys).sort()) {
    const expectedBucket = expectedBuckets.get(key);
    const actualBucket = actualBuckets.get(key);

    if (expectedBucket === undefined && actualBucket !== undefined) {
      added.push(delta(actualBucket.record, 0, actualBucket.count));
    } else if (expectedBucket !== undefined && actualBucket === undefined) {
      missing.push(delta(expectedBucket.record, expectedBucket.count, 0));
    } else if (
      expectedBucket !== undefined &&
      actualBucket !== undefined &&
      expectedBucket.count !== actualBucket.count
    ) {
      countChanged.push(
        delta(actualBucket.record, expectedBucket.count, actualBucket.count),
      );
    }
  }

  return { added, countChanged, missing };
}

/**
 * Formats a diagnostic diff result for CLI output.
 *
 * @param result Diagnostic comparison result.
 * @returns Human-readable diff report.
 */
export function formatDiagnosticDiff(result: DiagnosticDiffResult): string {
  if (diagnosticDiffIsEmpty(result)) {
    return "Diagnostic diff passed: snapshots report the same diagnostics.";
  }

  return [
    section("Missing diagnostics", result.missing),
    section("Added diagnostics", result.added),
    section("Changed diagnostic counts", result.countChanged),
  ]
    .filter((line) => line !== "")
    .join("\n\n");
}

/**
 * Checks whether a diagnostic diff is empty.
 *
 * @param result Diagnostic comparison result.
 * @returns True when snapshots match.
 */
export function diagnosticDiffIsEmpty(result: DiagnosticDiffResult): boolean {
  return (
    result.added.length === 0 &&
    result.countChanged.length === 0 &&
    result.missing.length === 0
  );
}

/**
 * Runs the diagnostic diff command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @returns Process exit code.
 */
export async function runDiagnosticDiffCli(
  args = process.argv.slice(2),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run diagnostics:diff [--quiet] <expected.json> <actual.json>

Compare two JSON arrays of normalized diagnostics. Records are matched by
tool, code, severity, file, route, and message; counts are compared separately.`);
    return 0;
  }

  const quiet = args.includes("--quiet");
  const paths = args.filter((arg) => arg !== "--quiet");

  if (paths.length !== 2) {
    console.error("Expected exactly two diagnostic JSON files.");
    return 1;
  }

  const expectedPath = paths[0];
  const actualPath = paths[1];

  if (expectedPath === undefined || actualPath === undefined) {
    console.error("Expected exactly two diagnostic JSON files.");
    return 1;
  }

  try {
    const result = compareDiagnostics(
      await readDiagnosticFile(expectedPath),
      await readDiagnosticFile(actualPath),
    );
    const report = formatDiagnosticDiff(result);

    if (diagnosticDiffIsEmpty(result)) {
      if (!quiet) {
        console.log(report);
      }
      return 0;
    }

    console.error(report);
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function delta(
  record: DiagnosticRecord,
  expectedCount: number,
  actualCount: number,
): DiagnosticDelta {
  return { actualCount, expectedCount, record };
}

function diagnosticBuckets(
  records: readonly DiagnosticRecord[],
): Map<string, DiagnosticBucket> {
  const buckets = new Map<string, DiagnosticBucket>();

  for (const record of records) {
    const key = diagnosticKey(record);
    const count = record.count ?? 1;
    const existing = buckets.get(key);

    buckets.set(key, {
      count: (existing?.count ?? 0) + count,
      record: existing?.record ?? record,
    });
  }

  return buckets;
}

function diagnosticKey(record: DiagnosticRecord): string {
  return JSON.stringify([
    record.tool,
    record.code,
    record.severity,
    record.file ?? "",
    record.route ?? "",
    record.message,
  ]);
}

function isDiagnosticRecord(value: unknown): value is DiagnosticRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "tool" in value &&
    "code" in value &&
    "severity" in value &&
    "message" in value &&
    typeof value.tool === "string" &&
    typeof value.code === "string" &&
    typeof value.severity === "string" &&
    typeof value.message === "string" &&
    (!("file" in value) || typeof value.file === "string") &&
    (!("route" in value) || typeof value.route === "string") &&
    (!("count" in value) ||
      (typeof value.count === "number" &&
        Number.isInteger(value.count) &&
        value.count > 0))
  );
}

async function readDiagnosticFile(path: string): Promise<DiagnosticRecord[]> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new TypeError(`${path} must contain a JSON array.`);
  }

  return parsed.map((item, index) => {
    if (!isDiagnosticRecord(item)) {
      throw new TypeError(
        `${path}[${index}] is not a valid diagnostic record.`,
      );
    }

    return item;
  });
}

function section(title: string, deltas: readonly DiagnosticDelta[]): string {
  if (deltas.length === 0) {
    return "";
  }

  return [
    `${title}:`,
    ...deltas.map(
      ({ actualCount, expectedCount, record }) =>
        `- ${record.tool}/${record.code} ${record.severity} ${record.file ?? record.route ?? "(global)"}: expected ${expectedCount}, actual ${actualCount}: ${record.message}`,
    ),
  ].join("\n");
}

if (import.meta.main) {
  try {
    process.exitCode = await runDiagnosticDiffCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
