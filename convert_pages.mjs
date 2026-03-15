import fs from 'fs';
import ts from 'typescript';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(pagesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const result = ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      removeComments: false
    }
  });

  // typescript transpileModule sometimes leaves empty exports or changes slight formatting,
  // but it works for stripping types and keeping JSX.
  const jsxPath = fullPath.replace(/\.tsx$/, '.jsx');
  fs.writeFileSync(jsxPath, result.outputText);
  fs.unlinkSync(fullPath);
  console.log(`Converted ${file} to ${path.basename(jsxPath)}`);
}
