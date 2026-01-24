-- Add advanced Python lessons: Classes, File I/O, Error Handling, and Decorators
-- This assumes Python language and units already exist
-- You may need to adjust the unit_id values based on your actual database

-- First, get the Python language ID and create/use appropriate units
DO $$
DECLARE
  python_lang_id uuid;
  unit_5_id uuid;
  unit_6_id uuid;
  unit_7_id uuid;
  unit_8_id uuid;
BEGIN
  -- Get Python language ID
  SELECT id INTO python_lang_id FROM public.languages WHERE slug = 'python' LIMIT 1;
  
  IF python_lang_id IS NULL THEN
    RAISE EXCEPTION 'Python language not found. Please ensure Python language exists.';
  END IF;

  -- Create Unit 5: Classes
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 5: Classes & Objects', 'Learn object-oriented programming with classes', 'indigo', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_5_id;
  
  SELECT id INTO unit_5_id FROM public.units WHERE language_id = python_lang_id AND order_index = 5 LIMIT 1;

  -- Create Unit 6: File I/O
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 6: File I/O', 'Read and write files in Python', 'teal', 6)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_6_id;
  
  SELECT id INTO unit_6_id FROM public.units WHERE language_id = python_lang_id AND order_index = 6 LIMIT 1;

  -- Create Unit 7: Error Handling
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 7: Error Handling', 'Handle errors and exceptions gracefully', 'red', 7)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_7_id;
  
  SELECT id INTO unit_7_id FROM public.units WHERE language_id = python_lang_id AND order_index = 7 LIMIT 1;

  -- Create Unit 8: Decorators
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 8: Decorators', 'Master Python decorators and advanced functions', 'pink', 8)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_8_id;
  
  SELECT id INTO unit_8_id FROM public.units WHERE language_id = python_lang_id AND order_index = 8 LIMIT 1;

  -- Unit 5: Classes - Lesson 1: Introduction to Classes
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_5_id, 'Introduction to Classes', 1)
  ON CONFLICT DO NOTHING;

  -- Add questions for Classes Lesson 1
  DO $$
  DECLARE
    lesson_1_id uuid;
  BEGIN
    SELECT id INTO lesson_1_id FROM public.lessons WHERE unit_id = unit_5_id AND order_index = 1 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_1_id, 'multiple-choice', 'What is a class in Python?', NULL, NULL, 
     '["A blueprint for creating objects", "A function that returns values", "A variable that stores data", "A loop that repeats code"]'::jsonb, 1, 10),
    (lesson_1_id, 'fill-blank', 'Complete the class definition:', 'class ___:\n    def __init__(self, name):\n        self.name = name', 
     'Person', '["Person", "person", "Class", "class"]'::jsonb, 2, 15),
    (lesson_1_id, 'code-runner', 'Create a class called Car with an __init__ method that sets a brand attribute. Then create an instance and print the brand.', 
     '# Your code here\n', 'BMW', NULL, 3, 20);
  END $$;

  -- Unit 5: Classes - Lesson 2: Class Methods and Attributes
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_5_id, 'Class Methods and Attributes', 2)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_2_id uuid;
  BEGIN
    SELECT id INTO lesson_2_id FROM public.lessons WHERE unit_id = unit_5_id AND order_index = 2 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_2_id, 'multiple-choice', 'What is the difference between instance methods and class methods?', NULL, NULL,
     '["Instance methods take self, class methods take cls", "There is no difference", "Class methods are faster", "Instance methods are static"]'::jsonb, 1, 10),
    (lesson_2_id, 'fill-blank', 'Complete the class method:', 'class Math:\n    @classmethod\n    def add(cls, a, b):\n        return ___', 
     'a + b', '["a + b", "a+b", "sum(a, b)", "cls.add(a, b)"]'::jsonb, 2, 15);
  END $$;

  -- Unit 6: File I/O - Lesson 1: Reading Files
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_6_id, 'Reading Files', 1)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_3_id uuid;
  BEGIN
    SELECT id INTO lesson_3_id FROM public.lessons WHERE unit_id = unit_6_id AND order_index = 1 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_3_id, 'multiple-choice', 'What is the correct way to open and read a file?', NULL, NULL,
     '["with open(\"file.txt\") as f: content = f.read()", "read(\"file.txt\")", "open(\"file.txt\").read()", "file.read(\"file.txt\")"]'::jsonb, 1, 10),
    (lesson_3_id, 'code-runner', 'Write code to read a file called "data.txt" and print its contents.', 
     '# Your code here\n', 'Hello, World!', NULL, 2, 20);
  END $$;

  -- Unit 6: File I/O - Lesson 2: Writing Files
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_6_id, 'Writing Files', 2)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_4_id uuid;
  BEGIN
    SELECT id INTO lesson_4_id FROM public.lessons WHERE unit_id = unit_6_id AND order_index = 2 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_4_id, 'fill-blank', 'Complete the file writing code:', 'with open("output.txt", "___") as f:\n    f.write("Hello")', 
     'w', '["w", "r", "a", "x"]'::jsonb, 1, 10),
    (lesson_4_id, 'code-runner', 'Write code to create a file "greeting.txt" and write "Hello, Python!" to it.', 
     '# Your code here\n', 'Success', NULL, 2, 20);
  END $$;

  -- Unit 7: Error Handling - Lesson 1: Try and Except
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_7_id, 'Try and Except', 1)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_5_id uuid;
  BEGIN
    SELECT id INTO lesson_5_id FROM public.lessons WHERE unit_id = unit_7_id AND order_index = 1 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_5_id, 'multiple-choice', 'What happens if an exception occurs in a try block?', NULL, NULL,
     '["The except block is executed", "The program crashes", "Nothing happens", "The try block repeats"]'::jsonb, 1, 10),
    (lesson_5_id, 'fill-blank', 'Complete the error handling:', 'try:\n    result = 10 / 0\nexcept ___:\n    print("Division by zero!")', 
     'ZeroDivisionError', '["ZeroDivisionError", "Error", "Exception", "ValueError"]'::jsonb, 2, 15),
    (lesson_5_id, 'code-runner', 'Write code that tries to convert user input to an integer, and catches ValueError if it fails.', 
     '# Your code here\nuser_input = "abc"\n', 'ValueError', NULL, 3, 20);
  END $$;

  -- Unit 7: Error Handling - Lesson 2: Finally and Else
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_7_id, 'Finally and Else Blocks', 2)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_6_id uuid;
  BEGIN
    SELECT id INTO lesson_6_id FROM public.lessons WHERE unit_id = unit_7_id AND order_index = 2 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_6_id, 'multiple-choice', 'When is the finally block executed?', NULL, NULL,
     '["Always, regardless of exceptions", "Only if an exception occurs", "Only if no exception occurs", "Never"]'::jsonb, 1, 10),
    (lesson_6_id, 'code-runner', 'Write a try-except-finally block that attempts to open a file and always prints "Done" in the finally block.', 
     '# Your code here\n', 'Done', NULL, 2, 20);
  END $$;

  -- Unit 8: Decorators - Lesson 1: Introduction to Decorators
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_8_id, 'Introduction to Decorators', 1)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_7_id uuid;
  BEGIN
    SELECT id INTO lesson_7_id FROM public.lessons WHERE unit_id = unit_8_id AND order_index = 1 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_7_id, 'multiple-choice', 'What is a decorator in Python?', NULL, NULL,
     '["A function that modifies another function", "A type of variable", "A loop construct", "A data structure"]'::jsonb, 1, 10),
    (lesson_7_id, 'fill-blank', 'Complete the decorator syntax:', '@my_decorator\n___ def my_function():\n    pass', 
     'def', '["def", "class", "return", "lambda"]'::jsonb, 2, 15);
  END $$;

  -- Unit 8: Decorators - Lesson 2: Creating Custom Decorators
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_8_id, 'Creating Custom Decorators', 2)
  ON CONFLICT DO NOTHING;

  DO $$
  DECLARE
    lesson_8_id uuid;
  BEGIN
    SELECT id INTO lesson_8_id FROM public.lessons WHERE unit_id = unit_8_id AND order_index = 2 LIMIT 1;
    
    INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
    (lesson_8_id, 'code-runner', 'Create a decorator called "timer" that prints "Function executed" before calling the function. Apply it to a function that prints "Hello".', 
     '# Your code here\n', 'Function executed\nHello', NULL, 1, 25);
  END $$;

END $$;
