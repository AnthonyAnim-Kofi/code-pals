-- Drag-order questions: backfill `options` (parallel labels for each block) and fix missing/invalid blocks.
-- The app grades on `blocks` + `correct_order`; `options` is used by admin/API consumers and avoids "empty options" rows.

-- 1) Options mirror block code strings (same order as `blocks` array).
UPDATE public.questions q
SET options = sub.opts
FROM (
  SELECT
    q2.id,
    COALESCE(
      (
        SELECT jsonb_agg(elem->>'code' ORDER BY ord)
        FROM jsonb_array_elements(q2.blocks) WITH ORDINALITY AS t(elem, ord)
      ),
      '[]'::jsonb
    ) AS opts
  FROM public.questions q2
  WHERE q2.type = 'drag-order'
    AND q2.blocks IS NOT NULL
    AND jsonb_typeof(q2.blocks) = 'array'
    AND jsonb_array_length(q2.blocks) > 0
) sub
WHERE q.id = sub.id
  AND q.type = 'drag-order'
  AND (q.options IS NULL OR q.options = '[]'::jsonb);

-- 2) Repair drag-order rows with no usable blocks or order (keeps instruction/hint when possible).
UPDATE public.questions q
SET
  blocks = '[
    {"id":"1","code":"# (1/3) First — set up inputs and environment"},
    {"id":"2","code":"# (2/3) Then — run the main logic"},
    {"id":"3","code":"# (3/3) Finally — return or display the result"}
  ]'::jsonb,
  correct_order = '["1","2","3"]'::jsonb,
  options = '[
    "# (1/3) First — set up inputs and environment",
    "# (2/3) Then — run the main logic",
    "# (3/3) Finally — return or display the result"
  ]'::jsonb
WHERE q.type = 'drag-order'
  AND (
    q.blocks IS NULL
    OR jsonb_typeof(q.blocks) <> 'array'
    OR jsonb_array_length(q.blocks) = 0
    OR q.correct_order IS NULL
    OR jsonb_typeof(q.correct_order) <> 'array'
    OR jsonb_array_length(q.correct_order) = 0
  );
