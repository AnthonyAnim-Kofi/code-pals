-- Add multiple programming languages with units and lessons
-- JavaScript, TypeScript, Rust, Go, HTML, CSS, Angular, Database, SQL

DO $$
DECLARE
  js_lang_id uuid;
  ts_lang_id uuid;
  rust_lang_id uuid;
  go_lang_id uuid;
  html_lang_id uuid;
  css_lang_id uuid;
  angular_lang_id uuid;
  db_lang_id uuid;
  sql_lang_id uuid;
  
  -- Unit IDs for each language
  js_unit_1_id uuid;
  js_unit_2_id uuid;
  ts_unit_1_id uuid;
  ts_unit_2_id uuid;
  rust_unit_1_id uuid;
  go_unit_1_id uuid;
  html_unit_1_id uuid;
  html_unit_2_id uuid;
  css_unit_1_id uuid;
  css_unit_2_id uuid;
  angular_unit_1_id uuid;
  db_unit_1_id uuid;
  sql_unit_1_id uuid;
  sql_unit_2_id uuid;
  
  lesson_id_var uuid;
BEGIN
  -- Insert JavaScript language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('JavaScript', 'javascript', '🟨', 'Learn the language of the web')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO js_lang_id;
  
  SELECT id INTO js_lang_id FROM public.languages WHERE slug = 'javascript' LIMIT 1;

  -- JavaScript Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (js_lang_id, 'Unit 1: JavaScript Basics', 'Variables, functions, and control flow', 'yellow', 1)
  RETURNING id INTO js_unit_1_id;

  -- JavaScript Unit 1 - Lesson 1
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_1_id, 'Variables and Data Types', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'Which keyword is used to declare a variable in modern JavaScript?', NULL, NULL,
   '["let", "var", "const", "All of the above"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the variable declaration:', '___ name = "CodeOwl";', 
   'const', '["const", "let", "var", "string"]'::jsonb, 2, 15),
  (lesson_id_var, 'code-runner', 'Create a variable called age with value 25 and print it.', 
   '// Your code here\n', '25', NULL, 3, 20);

  -- JavaScript Unit 1 - Lesson 2
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_1_id, 'Functions and Arrow Functions', 2)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is the correct arrow function syntax?', NULL, NULL,
   '["const add = (a, b) => a + b", "function add(a, b) => a + b", "add => (a, b) a + b", "const add => a + b"]'::jsonb, 1, 10),
  (lesson_id_var, 'code-runner', 'Write an arrow function that multiplies two numbers and returns the result.', 
   '// Your code here\n', '15', NULL, 2, 20);

  -- JavaScript Unit 2: Advanced
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (js_lang_id, 'Unit 2: Advanced JavaScript', 'Objects, arrays, and async/await', 'orange', 2)
  RETURNING id INTO js_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_2_id, 'Objects and Arrays', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the object property access:', 'const person = {name: "Alice"};\nconsole.log(person.___);', 
   'name', '["name", "person.name", "Alice", "person"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Create an array with numbers 1, 2, 3 and use map to double each number.', 
   '// Your code here\n', '2,4,6', NULL, 2, 25);

  -- Insert TypeScript language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('TypeScript', 'typescript', '🔷', 'Type-safe JavaScript')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO ts_lang_id;
  
  SELECT id INTO ts_lang_id FROM public.languages WHERE slug = 'typescript' LIMIT 1;

  -- TypeScript Unit 1: Types
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (ts_lang_id, 'Unit 1: TypeScript Types', 'Learn type annotations and interfaces', 'blue', 1)
  RETURNING id INTO ts_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (ts_unit_1_id, 'Basic Types', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the type annotation:', 'let age: ___ = 25;', 
   'number', '["number", "Number", "int", "Integer"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Create a variable name of type string with value "TypeScript" and print it.', 
   '// Your code here\n', 'TypeScript', NULL, 2, 20);

  -- TypeScript Unit 2: Interfaces
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (ts_lang_id, 'Unit 2: Interfaces and Classes', 'Define contracts and object shapes', 'indigo', 2)
  RETURNING id INTO ts_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (ts_unit_2_id, 'Interfaces', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the interface definition:', 'interface User {\n  name: string;\n  age: ___;\n}', 
   'number', '["number", "Number", "int", "string"]'::jsonb, 1, 15);

  -- Insert Rust language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Rust', 'rust', '🦀', 'Memory-safe systems programming')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO rust_lang_id;
  
  SELECT id INTO rust_lang_id FROM public.languages WHERE slug = 'rust' LIMIT 1;

  -- Rust Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (rust_lang_id, 'Unit 1: Rust Fundamentals', 'Ownership, borrowing, and basic syntax', 'orange', 1)
  RETURNING id INTO rust_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (rust_unit_1_id, 'Variables and Ownership', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is Rust''s key feature for memory safety?', NULL, NULL,
   '["Ownership system", "Garbage collection", "Manual memory management", "Reference counting"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the variable declaration:', 'let ___ x = 5;', 
   'mut', '["mut", "let", "var", "const"]'::jsonb, 2, 15);

  -- Insert Go language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Go', 'go', '🐹', 'Simple and efficient programming language')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO go_lang_id;
  
  SELECT id INTO go_lang_id FROM public.languages WHERE slug = 'go' LIMIT 1;

  -- Go Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (go_lang_id, 'Unit 1: Go Basics', 'Packages, functions, and variables', 'cyan', 1)
  RETURNING id INTO go_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (go_unit_1_id, 'Hello World and Packages', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the package declaration:', 'package ___\n\nimport "fmt"', 
   'main', '["main", "package", "go", "program"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Write a Go program that prints "Hello, Go!"', 
   'package main\n\nimport "fmt"\n\n// Your code here\n', 'Hello, Go!', NULL, 2, 20);

  -- Insert HTML language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('HTML', 'html', '🌐', 'Structure web pages')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO html_lang_id;
  
  SELECT id INTO html_lang_id FROM public.languages WHERE slug = 'html' LIMIT 1;

  -- HTML Unit 1: Structure
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (html_lang_id, 'Unit 1: HTML Structure', 'Tags, elements, and document structure', 'red', 1)
  RETURNING id INTO html_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (html_unit_1_id, 'Basic HTML Tags', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the heading tag:', '<___>Welcome</___>', 
   'h1', '["h1", "heading", "title", "header"]'::jsonb, 1, 10),
  (lesson_id_var, 'multiple-choice', 'Which tag is used for the main content?', NULL, NULL,
   '["<main>", "<body>", "<content>", "<div>"]'::jsonb, 2, 10);

  -- HTML Unit 2: Forms
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (html_lang_id, 'Unit 2: HTML Forms', 'Create interactive forms', 'pink', 2)
  RETURNING id INTO html_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (html_unit_2_id, 'Form Elements', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the input tag:', '<input type="___" name="email">', 
   'email', '["email", "text", "input", "mail"]'::jsonb, 1, 15);

  -- Insert CSS language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('CSS', 'css', '🎨', 'Style and design web pages')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO css_lang_id;
  
  SELECT id INTO css_lang_id FROM public.languages WHERE slug = 'css' LIMIT 1;

  -- CSS Unit 1: Selectors
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (css_lang_id, 'Unit 1: CSS Selectors', 'Target elements with selectors', 'blue', 1)
  RETURNING id INTO css_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (css_unit_1_id, 'Basic Selectors', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the class selector:', '.___ { color: red; }', 
   'myClass', '["myClass", ".myClass", "#myClass", "my-class"]'::jsonb, 1, 15),
  (lesson_id_var, 'multiple-choice', 'Which selector targets an element by ID?', NULL, NULL,
   '["#id", ".id", "id", "[id]"]'::jsonb, 2, 10);

  -- CSS Unit 2: Layout
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (css_lang_id, 'Unit 2: CSS Layout', 'Flexbox and Grid', 'purple', 2)
  RETURNING id INTO css_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (css_unit_2_id, 'Flexbox', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the flexbox property:', 'display: ___;', 
   'flex', '["flex", "grid", "block", "inline"]'::jsonb, 1, 15);

  -- Insert Angular language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Angular', 'angular', '🅰️', 'Build dynamic web applications')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO angular_lang_id;
  
  SELECT id INTO angular_lang_id FROM public.languages WHERE slug = 'angular' LIMIT 1;

  -- Angular Unit 1: Components
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (angular_lang_id, 'Unit 1: Angular Components', 'Create reusable components', 'red', 1)
  RETURNING id INTO angular_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (angular_unit_1_id, 'Component Basics', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What decorator is used to define an Angular component?', NULL, NULL,
   '["@Component", "@Component()", "@NgComponent", "@AngularComponent"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the component selector:', '@Component({\n  selector: "___-app"\n})', 
   'app', '["app", "my", "component", "angular"]'::jsonb, 2, 15);

  -- Insert Database language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Database', 'database', '🗄️', 'Learn database concepts and design')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO db_lang_id;
  
  SELECT id INTO db_lang_id FROM public.languages WHERE slug = 'database' LIMIT 1;

  -- Database Unit 1: Concepts
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (db_lang_id, 'Unit 1: Database Fundamentals', 'Tables, relationships, and normalization', 'slate', 1)
  RETURNING id INTO db_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (db_unit_1_id, 'Database Concepts', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is a primary key?', NULL, NULL,
   '["A unique identifier for a row", "A foreign key", "An index", "A constraint"]'::jsonb, 1, 10),
  (lesson_id_var, 'multiple-choice', 'What does ACID stand for in databases?', NULL, NULL,
   '["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "All, Create, Insert, Delete", "Application, Code, Interface, Database"]'::jsonb, 2, 15);

  -- Insert SQL language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('SQL', 'sql', '📊', 'Query and manipulate databases')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO sql_lang_id;
  
  SELECT id INTO sql_lang_id FROM public.languages WHERE slug = 'sql' LIMIT 1;

  -- SQL Unit 1: Queries
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (sql_lang_id, 'Unit 1: SQL Queries', 'SELECT, WHERE, and JOIN', 'blue', 1)
  RETURNING id INTO sql_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (sql_unit_1_id, 'SELECT Statements', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the SELECT statement:', 'SELECT ___ FROM users;', 
   '*', '["*", "all", "everything", "data"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Write a SQL query to select all users where age is greater than 18.', 
   '-- Your SQL query here\n', 'SELECT * FROM users WHERE age > 18;', NULL, 2, 20);

  -- SQL Unit 2: Advanced
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (sql_lang_id, 'Unit 2: Advanced SQL', 'JOINs, GROUP BY, and subqueries', 'indigo', 2)
  RETURNING id INTO sql_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (sql_unit_2_id, 'JOIN Operations', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'Which JOIN returns all rows from both tables?', NULL, NULL,
   '["FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN"]'::jsonb, 1, 15),
  (lesson_id_var, 'fill-blank', 'Complete the INNER JOIN:', 'SELECT * FROM users\nINNER JOIN orders ON users.id = orders.___;', 
   'user_id', '["user_id", "id", "users.id", "order_id"]'::jsonb, 2, 15);

END $$;
