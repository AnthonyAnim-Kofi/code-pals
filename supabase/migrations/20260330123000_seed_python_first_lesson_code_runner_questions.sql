-- Seed test code-runner questions into the first Python lesson.
-- Useful for validating the Monaco editor + run-code flow quickly.

DO $$
DECLARE
  python_lang_id uuid;
  first_unit_id uuid;
  first_lesson_id uuid;
  next_order integer;
BEGIN
  SELECT id
  INTO python_lang_id
  FROM public.languages
  WHERE slug = 'python'
  LIMIT 1;

  IF python_lang_id IS NULL THEN
    RAISE EXCEPTION 'Python language not found.';
  END IF;

  -- "First lesson" = earliest active unit/order for Python, then earliest lesson/order in that unit.
  SELECT u.id
  INTO first_unit_id
  FROM public.units u
  WHERE u.language_id = python_lang_id
  ORDER BY u.order_index ASC, u.created_at ASC
  LIMIT 1;

  IF first_unit_id IS NULL THEN
    RAISE EXCEPTION 'No units found for Python language.';
  END IF;

  SELECT l.id
  INTO first_lesson_id
  FROM public.lessons l
  WHERE l.unit_id = first_unit_id
  ORDER BY l.order_index ASC, l.created_at ASC
  LIMIT 1;

  IF first_lesson_id IS NULL THEN
    RAISE EXCEPTION 'No lessons found in first Python unit.';
  END IF;

  SELECT COALESCE(MAX(order_index), 0) + 1
  INTO next_order
  FROM public.questions
  WHERE lesson_id = first_lesson_id;

  -- Q1
  IF NOT EXISTS (
    SELECT 1
    FROM public.questions
    WHERE lesson_id = first_lesson_id
      AND type = 'code-runner'
      AND instruction = 'Monaco test 1: Print exactly Hello from Python.'
  ) THEN
    INSERT INTO public.questions (
      lesson_id,
      type,
      instruction,
      initial_code,
      expected_output,
      hint,
      order_index,
      xp_reward
    ) VALUES (
      first_lesson_id,
      'code-runner',
      'Monaco test 1: Print exactly Hello from Python.',
      '# Print the word exactly as expected\n',
      'Hello from Python',
      'Use print("Hello from Python")',
      next_order,
      20
    );
    next_order := next_order + 1;
  END IF;

  -- Q2
  IF NOT EXISTS (
    SELECT 1
    FROM public.questions
    WHERE lesson_id = first_lesson_id
      AND type = 'code-runner'
      AND instruction = 'Monaco test 2: Store 7 in x and print x * 3.'
  ) THEN
    INSERT INTO public.questions (
      lesson_id,
      type,
      instruction,
      initial_code,
      expected_output,
      hint,
      order_index,
      xp_reward
    ) VALUES (
      first_lesson_id,
      'code-runner',
      'Monaco test 2: Store 7 in x and print x * 3.',
      '# Create a variable x and print x * 3\n',
      '21',
      'x = 7 then print(x * 3)',
      next_order,
      20
    );
    next_order := next_order + 1;
  END IF;

  -- Q3
  IF NOT EXISTS (
    SELECT 1
    FROM public.questions
    WHERE lesson_id = first_lesson_id
      AND type = 'code-runner'
      AND instruction = 'Monaco test 3: Print two lines: Line A and Line B.'
  ) THEN
    INSERT INTO public.questions (
      lesson_id,
      type,
      instruction,
      initial_code,
      expected_output,
      hint,
      order_index,
      xp_reward
    ) VALUES (
      first_lesson_id,
      'code-runner',
      'Monaco test 3: Print two lines: Line A and Line B.',
      '# Print the two lines in order\n',
      'Line A\nLine B',
      'You can use two print() calls',
      next_order,
      25
    );
  END IF;
END $$;

