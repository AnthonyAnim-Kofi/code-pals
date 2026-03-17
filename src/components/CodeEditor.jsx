/**
 * CodeEditor – CodeMirror-based code editor with syntax highlighting for Python, JS, HTML, CSS.
 * Supports read-only mode, placeholder text, and auto-height.
 */
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { cn } from "@/lib/utils";
function getLanguageExtension(lang) {
    switch (lang) {
        case "python": return python();
        case "javascript": return javascript();
        case "html": return html();
        case "css": return css();
        default: return python();
    }
}
export function CodeEditor({ value, onChange, language = "python", readOnly = false, className, minHeight = "160px", }) {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    // Track if we're programmatically updating to avoid feedback loops
    const isUpdatingRef = useRef(false);
    useEffect(() => {
        if (!editorRef.current)
            return;
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
        const state = EditorState.create({
            doc: value,
            extensions,
        });
        const view = new EditorView({
            state,
            parent: editorRef.current,
        });
        viewRef.current = view;
        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // Only recreate on language/readOnly change, not value
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, readOnly, minHeight]);
    // Sync external value changes
    useEffect(() => {
        const view = viewRef.current;
        if (!view)
            return;
        const currentDoc = view.state.doc.toString();
        if (currentDoc !== value) {
            isUpdatingRef.current = true;
            view.dispatch({
                changes: { from: 0, to: currentDoc.length, insert: value },
            });
            isUpdatingRef.current = false;
        }
    }, [value]);
    return (<div ref={editorRef} className={cn("rounded-xl overflow-hidden border border-border", readOnly && "opacity-70", className)}/>);
}
