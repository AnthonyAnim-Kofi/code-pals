/**
 * Shared admin bulk-import: CSV parsing, JSON loading, question field normalization,
 * and sequential import with accurate progress.
 */

/** @typedef {{ current: number, total: number, percent: number }} ImportProgress */

/**
 * RFC-style CSV rows (one record per line). Handles quoted fields and commas inside quotes.
 * Does not handle multiline quoted cells (rare for admin curriculum imports).
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
export function parseCSV(text) {
  const raw = text.trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Split a single CSV line into fields (handles `"a,b"` and `""` escapes).
 */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * @param {string} [jsonContent]
 * @param {string} [csvContent]
 * @returns {{ ok: true, data: unknown[] } | { ok: false, error: string }}
 */
export function parseImportPayload(jsonContent, csvContent) {
  const j = jsonContent?.trim();
  const c = csvContent?.trim();

  if (j) {
    try {
      const parsed = JSON.parse(j);
      const data = Array.isArray(parsed) ? parsed : [parsed];
      return { ok: true, data };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "parse error";
      return { ok: false, error: `Invalid JSON: ${msg}` };
    }
  }

  if (c) {
    return { ok: true, data: parseCSV(c) };
  }

  return { ok: false, error: "No data to import" };
}

/**
 * Coerce question row fields from CSV strings into DB shapes.
 * @param {Record<string, unknown>} item
 */
export function normalizeQuestionPayload(item) {
  let options = item.options;
  if (typeof options === "string") {
    try {
      options = JSON.parse(options);
    } catch {
      options = options.split("|").map((o) => o.trim());
    }
  }

  let blocks = item.blocks;
  if (typeof blocks === "string") {
    try {
      blocks = JSON.parse(blocks);
    } catch {
      blocks = undefined;
    }
  }

  let correct_order = item.correct_order;
  if (typeof correct_order === "string") {
    try {
      correct_order = JSON.parse(correct_order);
    } catch {
      correct_order = correct_order.split("|").map((o) => o.trim());
    }
  }

  return {
    type: item.type,
    instruction: item.instruction,
    code: item.code ?? null,
    answer: item.answer ?? null,
    options: options ?? null,
    blocks: blocks ?? null,
    correct_order: correct_order ?? null,
    hint: item.hint ?? null,
    initial_code: item.initial_code ?? null,
    expected_output: item.expected_output ?? null,
    order_index: item.order_index ?? 0,
    xp_reward: item.xp_reward ?? 10,
  };
}

/**
 * Import rows one-by-one so each failure gets its own message; progress is per row (accurate).
 *
 * @param {{
 *   rows: unknown[],
 *   onProgress?: (p: ImportProgress) => void,
 *   processRow: (row: unknown, index: number) => Promise<void>,
 *   labelError?: (row: unknown, index: number, message: string) => string
 * }} opts
 * @returns {Promise<{ success: number, errors: string[] }>}
 */
export async function runSequentialImport({
  rows,
  onProgress,
  processRow,
  labelError,
}) {
  const errors = [];
  let success = 0;
  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    try {
      await processRow(row, i);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(labelError ? labelError(row, i, msg) : msg);
    }

    onProgress?.({
      current: i + 1,
      total,
      percent: total ? Math.round(((i + 1) / total) * 100) : 100,
    });

    if (i % 25 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return { success, errors };
}
