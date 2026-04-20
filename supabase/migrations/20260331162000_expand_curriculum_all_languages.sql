-- ============================================================
-- Curriculum seed: 16 units, 6-7 lessons, 7-9 questions,
-- one rich study-guide note per unit.
-- Questions: fill-blank, multiple-choice, drag-order only.
-- Idempotent: safe to rerun without duplicating rows.
-- ============================================================

DO $do$
DECLARE
  lang            RECORD;
  unit_idx        INTEGER;
  lesson_idx      INTEGER;
  q_idx           INTEGER;

  v_unit_id       UUID;
  v_lesson_id     UUID;
  v_existing_id   UUID;

  lesson_count    INTEGER;
  question_count  INTEGER;

  unit_title        TEXT;
  lesson_title      TEXT;
  lesson_note_title TEXT;
  lesson_note_body  TEXT;

  q_type          TEXT;
  q_instruction   TEXT;
  q_code          TEXT;
  q_answer        TEXT;
  q_options       JSONB;
  q_blocks        JSONB;
  q_order         JSONB;
  q_hint          TEXT;

  cpfx            TEXT;   -- comment prefix
  flang           TEXT;   -- fenced-code language name

  -- ── Deterministic content arrays ──────────────────────────
  unit_names TEXT[] := ARRAY[
    'Getting Started & Syntax Basics',
    'Variables & Data Types',
    'Operators & Expressions',
    'Control Flow: Conditionals',
    'Control Flow: Loops',
    'Functions & Scope',
    'Data Structures: Arrays & Lists',
    'Data Structures: Maps & Dictionaries',
    'Object-Oriented Basics',
    'Classes & Inheritance',
    'Error Handling & Exceptions',
    'File I/O & Streams',
    'Modules & Packages',
    'Asynchronous Programming',
    'Standard Library Essentials',
    'Advanced Patterns & Best Practices'
  ];

  lesson_topics TEXT[] := ARRAY[
    'Core Concepts & Declarations',
    'Memory, Scope & Lifecycles',
    'Common Built-in Functions',
    'Working with Complex Data',
    'Handling Edge Cases',
    'Performance & Optimization',
    'Real-World Application Patterns'
  ];

  -- fill-blank: instruction templates (%1$s = topic, %2$s = lang)
  fb_instrs TEXT[] := ARRAY[
    'Complete the %2$s statement that declares a %1$s.',
    'Fill in the blank to make this %2$s expression valid for %1$s.',
    'What keyword completes this %2$s snippet about %1$s?',
    'Complete the built-in call that handles %1$s in %2$s.',
    'Fill in the missing value so the %1$s logic runs correctly.'
  ];

  -- multiple-choice: instruction templates
  mc_instrs TEXT[] := ARRAY[
    'Which statement correctly describes %1$s in %2$s?',
    'What is the primary purpose of %1$s in %2$s?',
    'In %2$s, what happens when you incorrectly apply %1$s?',
    'Which answer best defines the behavior of %1$s?',
    'Select the true statement about %1$s in %2$s.'
  ];

  -- drag-order: instruction templates
  do_instrs TEXT[] := ARRAY[
    'Arrange these %2$s steps for %1$s in the correct order.',
    'Put these %1$s blocks into the right execution sequence.',
    'Order the %2$s code blocks that implement %1$s correctly.',
    'Sort these lines so the %1$s program runs without errors.'
  ];

  -- multiple-choice wrong options cycling arrays
  mc_wrongs_a TEXT[] := ARRAY[
    'It always throws a runtime exception.',
    'It is only available in older versions of the language.',
    'It silently converts all values to strings.',
    'It has no effect and can be omitted safely.',
    'It reverses the order of all elements automatically.'
  ];
  mc_wrongs_b TEXT[] := ARRAY[
    'It causes an infinite loop if used without a guard.',
    'It only works with integer types.',
    'It is deprecated and should never be used.',
    'It requires a third-party library to function.',
    'It compiles but produces undefined behavior.'
  ];
  mc_wrongs_c TEXT[] := ARRAY[
    'It is identical to the assignment operator.',
    'It mutates the original value regardless of scope.',
    'It can only be called once per program run.',
    'It bypasses all type-checking rules.',
    'It returns nothing and discards the result.'
  ];

  -- drag-order block content by lesson topic index
  drag_step1 TEXT[] := ARRAY[
    'Declare and import required dependencies',
    'Define the variable and assign an initial value',
    'Open or establish the required resource',
    'Validate and sanitize all incoming input',
    'Set up the error handling boundary',
    'Initialise the data structure',
    'Define the entry-point function'
  ];
  drag_step2 TEXT[] := ARRAY[
    'Apply the core logic or transformation',
    'Iterate over the data collection',
    'Call the processing function with arguments',
    'Check the condition and branch accordingly',
    'Execute the main algorithm step',
    'Map or filter the collection',
    'Invoke the external service or API'
  ];
  drag_step3 TEXT[] := ARRAY[
    'Return or output the computed result',
    'Close or release the resource cleanly',
    'Handle any errors and log them',
    'Assert the expected output in tests',
    'Format and display the final value',
    'Persist the result to storage',
    'Return the processed object to the caller'
  ];

  -- code snippets for notes: (cpfx, topic, language-specific body)
  note_snippet TEXT;

BEGIN
  FOR lang IN
    SELECT id, name, slug FROM public.languages
    WHERE is_active = true ORDER BY name
  LOOP
    cpfx := CASE
      WHEN lang.slug IN ('python','ruby','r','perl','bash','shell') THEN '#'
      WHEN lang.slug = 'sql' THEN '--'
      ELSE '//'
    END;

    flang := CASE
      WHEN lang.slug = 'c++'  THEN 'cpp'
      WHEN lang.slug = 'c#'   THEN 'csharp'
      WHEN lang.slug = 'html' THEN 'html'
      WHEN lang.slug = 'css'  THEN 'css'
      WHEN lang.slug = 'sql'  THEN 'sql'
      ELSE lang.slug
    END;

    -- ════════════════════════════════════════════════════════
    FOR unit_idx IN 1..16 LOOP
      unit_title := format('Unit %s: %s',
                           LPAD(unit_idx::TEXT,2,'0'),
                           unit_names[unit_idx]);

      SELECT u.id INTO v_unit_id
      FROM public.units u
      WHERE u.language_id = lang.id
        AND (u.order_index = unit_idx - 1
             OR lower(u.title) = lower(unit_title))
      ORDER BY u.order_index LIMIT 1;

      IF v_unit_id IS NULL THEN
        INSERT INTO public.units
          (language_id, title, description, color, order_index, is_active)
        VALUES (
          lang.id, unit_title,
          format('Master %s in %s with hands-on exercises and clear explanations.',
                 unit_names[unit_idx], lang.name),
          CASE unit_idx % 4
            WHEN 1 THEN 'green' WHEN 2 THEN 'blue'
            WHEN 3 THEN 'orange' ELSE 'purple' END,
          unit_idx - 1, true
        )
        RETURNING id INTO v_unit_id;
      END IF;

      -- 6 or 7 lessons alternating
      lesson_count := 6 + (unit_idx % 2);

      -- ════════════════════════════════════════════════════════
      FOR lesson_idx IN 1..lesson_count LOOP
        lesson_title := format('Lesson %s.%s: %s',
                               unit_idx, lesson_idx,
                               lesson_topics[lesson_idx]);

        -- Idempotent lesson
        SELECT l.id INTO v_lesson_id
        FROM public.lessons l
        WHERE l.unit_id = v_unit_id
          AND (l.order_index = lesson_idx - 1
               OR lower(l.title) = lower(lesson_title))
        ORDER BY l.order_index LIMIT 1;

        IF v_lesson_id IS NULL THEN
          INSERT INTO public.lessons (unit_id, title, order_index, is_active)
          VALUES (v_unit_id, lesson_title, lesson_idx - 1, true)
          RETURNING id INTO v_lesson_id;
        END IF;

        -- ── Build a per-lesson note ───────────────────────────
        -- Build a language-appropriate code snippet for the note
        note_snippet := CASE lang.slug
          WHEN 'python' THEN format(
$py$%s --- %s ---
def handle_%s(data):
    """Process data using %s techniques."""
    result = []
    for item in data:
        if item is not None:
            result.append(item)
    return result

sample = [1, None, 3, None, 5]
print(handle_%s(sample))
$py$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))

          WHEN 'javascript' THEN format(
$js$%s --- %s ---
function handle%s(data) {
  // Filter out null/undefined values
  return data.filter(item => item != null).map(item => {
    return { value: item, processed: true };
  });
}

const sample = [1, null, 3, undefined, 5];
console.log(handle%s(sample));
$js$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'typescript' THEN format(
$ts$%s --- %s ---
interface DataItem { value: number; processed: boolean; }

function handle%s(data: (number | null)[]): DataItem[] {
  return data
    .filter((item): item is number => item !== null)
    .map(value => ({ value, processed: true }));
}

const sample: (number | null)[] = [1, null, 3, null, 5];
console.log(handle%s(sample));
$ts$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'java' THEN format(
$java$%s --- %s ---
import java.util.*;
import java.util.stream.*;

public class Example {
    public static List<Integer> handle%s(List<Integer> data) {
        return data.stream()
                   .filter(Objects::nonNull)
                   .collect(Collectors.toList());
    }
    public static void main(String[] args) {
        List<Integer> sample = Arrays.asList(1, null, 3, null, 5);
        System.out.println(handle%s(sample));
    }
}
$java$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'cpp' THEN format(
$cpp$%s --- %s ---
#include <iostream>
#include <vector>
#include <algorithm>

std::vector<int> handle_%s(const std::vector<int>& data) {
    std::vector<int> result;
    std::copy_if(data.begin(), data.end(),
                 std::back_inserter(result),
                 [](int v){ return v != 0; });
    return result;
}

int main() {
    std::vector<int> sample = {1, 0, 3, 0, 5};
    auto res = handle_%s(sample);
    for (int v : res) std::cout << v << " ";
}
$cpp$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))

          WHEN 'go' THEN format(
$go$%s --- %s ---
package main
import "fmt"

func handle%s(data []int) []int {
    result := []int{}
    for _, v := range data {
        if v != 0 {
            result = append(result, v)
        }
    }
    return result
}

func main() {
    sample := []int{1, 0, 3, 0, 5}
    fmt.Println(handle%s(sample))
}
$go$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'ruby' THEN format(
$rb$%s --- %s ---
def handle_%s(data)
  data.compact.map { |item| { value: item, processed: true } }
end

sample = [1, nil, 3, nil, 5]
puts handle_%s(sample).inspect
$rb$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))

          WHEN 'swift' THEN format(
$sw$%s --- %s ---
func handle%s(_ data: [Int?]) -> [Int] {
    return data.compactMap { $0 }
}

let sample: [Int?] = [1, nil, 3, nil, 5]
print(handle%s(sample))
$sw$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'kotlin' THEN format(
$kt$%s --- %s ---
fun handle%s(data: List<Int?>): List<Int> {
    return data.filterNotNull()
}

fun main() {
    val sample = listOf(1, null, 3, null, 5)
    println(handle%s(sample))
}
$kt$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          WHEN 'rust' THEN format(
$rs$%s --- %s ---
fn handle_%s(data: Vec<Option<i32>>) -> Vec<i32> {
    data.into_iter().flatten().collect()
}

fn main() {
    let sample = vec![Some(1), None, Some(3), None, Some(5)];
    println!("{:?}", handle_%s(sample));
}
$rs$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))

          WHEN 'php' THEN format(
$php$%s --- %s ---
<?php
function handle_%s(array $data): array {
    return array_values(array_filter($data, fn($v) => $v !== null));
}

$sample = [1, null, 3, null, 5];
var_dump(handle_%s($sample));
?>
$php$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))

          WHEN 'sql' THEN format(
$sql$%s --- %s ---
%s Create a table for this example
CREATE TABLE items (id INT, value TEXT);
INSERT INTO items VALUES (1, 'alpha'), (2, NULL), (3, 'gamma');

%s Query filtering nulls (%s)
SELECT id, value
FROM items
WHERE value IS NOT NULL
ORDER BY id;
$sql$,
            cpfx, lesson_topics[lesson_idx],
            cpfx, cpfx, lesson_topics[lesson_idx])

          WHEN 'dart' THEN format(
$dart$%s --- %s ---
List<int> handle%s(List<int?> data) {
  return data.whereType<int>().toList();
}

void main() {
  final sample = <int?>[1, null, 3, null, 5];
  print(handle%s(sample));
}
$dart$,
            cpfx, lesson_topics[lesson_idx],
            replace(initcap(lesson_topics[lesson_idx]),' ',''),
            replace(initcap(lesson_topics[lesson_idx]),' ',''))

          ELSE format(
$gen$%s --- %s ---
function handle_%s(data) {
    %s Filter and process the collection
    result = []
    for item in data:
        if item != null:
            result.add(item)
    return result
}

sample = [1, null, 3, null, 5]
print(handle_%s(sample))
$gen$,
            cpfx, lesson_topics[lesson_idx],
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')),
            cpfx,
            lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')))
        END;

        lesson_note_title := format('%s – Study Note', lesson_title);
        lesson_note_body  := format(
$md$# %s

> **Language:** %s | **Topic:** %s

---

## What you will learn
- How to work with **%s** in %s
- Common patterns and pitfalls to avoid
- How to apply this concept in real programs

## Code Example

```%s
%s
```

## Key Takeaways
- Always validate inputs before processing them
- Use the language's built-in tools before writing custom logic
- Keep functions small and focused on a single responsibility

## Practice Tips
- Re-read the code example above until you can predict the output
- Try modifying the example values and see what changes
- Attempt the lesson questions below to test your understanding
$md$,
          lesson_note_title,
          lang.name, lesson_topics[lesson_idx],
          lesson_topics[lesson_idx], lang.name,
          flang,
          note_snippet);

        -- Idempotent per-lesson note insert
        SELECT n.id INTO v_existing_id
        FROM public.unit_notes n
        WHERE n.unit_id = v_unit_id
          AND (n.order_index = lesson_idx - 1
               OR lower(n.title) = lower(lesson_note_title))
        ORDER BY n.order_index LIMIT 1;

        IF v_existing_id IS NULL THEN
          INSERT INTO public.unit_notes (unit_id, title, content, order_index)
          VALUES (v_unit_id, lesson_note_title, lesson_note_body, lesson_idx - 1);
        END IF;

        -- ════════════════════════════════════════════════════
        -- Questions (7-9 per lesson, no code-runner)
        question_count := 7 + ((unit_idx + lesson_idx) % 3);

        FOR q_idx IN 1..question_count LOOP
          q_type := CASE (q_idx - 1) % 3
            WHEN 0 THEN 'fill-blank'
            WHEN 1 THEN 'multiple-choice'
            ELSE 'drag-order'
          END;

          -- Idempotent question check
          SELECT q.id INTO v_existing_id
          FROM public.questions q
          WHERE q.lesson_id = v_lesson_id
            AND q.order_index = q_idx - 1
          LIMIT 1;

          IF v_existing_id IS NULL THEN

            IF q_type = 'fill-blank' THEN
              -- Cycle through 5 fill-blank instruction templates
              q_instruction := format(
                fb_instrs[1 + ((q_idx - 1) % array_length(fb_instrs,1))],
                lesson_topics[lesson_idx], lang.name
              );
              -- Build a code snippet with a blank appropriate to the topic
              q_code := format(
                '%s %s — fill in the blank%s%s_value = ___',
                cpfx, lesson_topics[lesson_idx],
                chr(10),
                lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g'))
              );
              q_answer := format('"%s_result"',
                lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g')));
              q_options := to_jsonb(ARRAY[
                q_answer,
                format('"%s_error"',
                  lower(regexp_replace(lesson_topics[lesson_idx],'\W+','_','g'))),
                '"undefined"',
                '"null_value"'
              ]);
              q_hint := format(
                'Think about how %s defines this value in the context of %s.',
                lang.name, lesson_topics[lesson_idx]);

              INSERT INTO public.questions
                (lesson_id,type,instruction,code,answer,options,hint,order_index,xp_reward)
              VALUES
                (v_lesson_id,'fill-blank',q_instruction,q_code,
                 q_answer,q_options,q_hint,q_idx-1,10);

            ELSIF q_type = 'multiple-choice' THEN
              q_instruction := format(
                mc_instrs[1 + ((q_idx - 1) % array_length(mc_instrs,1))],
                lesson_topics[lesson_idx], lang.name
              );
              q_options := to_jsonb(ARRAY[
                format('It correctly applies %s to produce a valid %s result.',
                       lesson_topics[lesson_idx], lang.name),
                mc_wrongs_a[1 + (q_idx % array_length(mc_wrongs_a,1))],
                mc_wrongs_b[1 + ((q_idx+1) % array_length(mc_wrongs_b,1))],
                mc_wrongs_c[1 + ((q_idx+2) % array_length(mc_wrongs_c,1))]
              ]);
              q_hint := format(
                'Review how %s behaves with %s in %s.',
                lesson_topics[lesson_idx], unit_names[unit_idx], lang.name);

              INSERT INTO public.questions
                (lesson_id,type,instruction,answer,options,hint,order_index,xp_reward)
              VALUES
                (v_lesson_id,'multiple-choice',q_instruction,
                 '0',q_options,q_hint,q_idx-1,10);

            ELSE -- drag-order
              q_instruction := format(
                do_instrs[1 + ((q_idx - 1) % array_length(do_instrs,1))],
                lesson_topics[lesson_idx], lang.name
              );
              -- Numbered (1/3)(2/3)(3/3) labels so execution order is unambiguous; `options` mirrors blocks for admin/API.
              q_blocks := jsonb_build_array(
                jsonb_build_object('id','1','code',
                  format('%s (1/3) First — %s', cpfx,
                         drag_step1[1 + ((lesson_idx-1) % array_length(drag_step1,1))])),
                jsonb_build_object('id','2','code',
                  format('%s (2/3) Then — %s', cpfx,
                         drag_step2[1 + ((lesson_idx-1) % array_length(drag_step2,1))])),
                jsonb_build_object('id','3','code',
                  format('%s (3/3) Finally — %s', cpfx,
                         drag_step3[1 + ((lesson_idx-1) % array_length(drag_step3,1))]))
              );
              q_order := jsonb_build_array('1','2','3');
              q_options := jsonb_build_array(
                (q_blocks->0->>'code'),
                (q_blocks->1->>'code'),
                (q_blocks->2->>'code')
              );
              q_hint := 'Always set up first, execute the logic second, then handle the output last.';

              INSERT INTO public.questions
                (lesson_id,type,instruction,blocks,correct_order,options,hint,order_index,xp_reward)
              VALUES
                (v_lesson_id,'drag-order',q_instruction,
                 q_blocks,q_order,q_options,q_hint,q_idx-1,15);
            END IF;
          END IF;
        END LOOP; -- questions
      END LOOP; -- lessons

    END LOOP; -- units
  END LOOP; -- languages
END $do$;
