-- Remove all code-runner questions from the curriculum (seed data and any admin-created).
DELETE FROM public.questions
WHERE type = 'code-runner';
