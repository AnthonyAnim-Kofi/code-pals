/**
 * CodeEditor – CodeMirror-based code editor with syntax highlighting for 13+ languages.
 * Supports read-only mode, placeholder text, and auto-height.
 */
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { php } from "@codemirror/lang-php";
import { go } from "@codemirror/legacy-modes/mode/go";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { kotlin } from "@codemirror/legacy-modes/mode/clike";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { oneDark } from "@codemirror/theme-one-dark";
import { cn } from "@/lib/utils";

function getLanguageExtension(lang) {
  switch (lang) {
    case "python": return python();
    case "javascript": return javascript();
    case "typescript": return javascript({ typescript: true });
    case "html": return html();
    case "css": return css();
    case "java": return java();
    case "c":
    case "cpp": return cpp();
    case "csharp": return StreamLanguage.define(csharp);
    case "rust": return rust();
    case "php": return php();
    case "go": return StreamLanguage.define(go);
    case "ruby": return StreamLanguage.define(ruby);
    case "swift": return StreamLanguage.define(swift);
    case "kotlin": return StreamLanguage.define(kotlin);
    default: return python();
  }
}

export function CodeEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  className,
  minHeight = "160px",
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;
    const extensions = [
      basicSetup,
      getLanguageExtension(language),
      oneDark,
      EditorView.theme({
        "&": { minHeight, fontSize: "14px" },
        ".cm-scroller": { overflow: "auto" },
        ".cm-content": { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingRef.current) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
    ];
    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }
    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly, minHeight]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={cn(
        "rounded-xl overflow-hidden border border-border",
        readOnly && "opacity-70",
        className
      )}
    />
  );
}
