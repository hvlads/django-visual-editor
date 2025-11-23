import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import * as prettier from 'prettier/standalone';
import * as htmlParser from 'prettier/plugins/html';

export class HTMLEditor {
  private container: HTMLElement;
  private editorView: EditorView | null = null;
  private onSave: (html: string) => void;
  private initialContent: string;
  private editorContainer: HTMLElement;
  private toolbar: HTMLElement;

  constructor(
    container: HTMLElement,
    initialContent: string,
    onSave: (html: string) => void
  ) {
    this.container = container;
    this.initialContent = initialContent;
    this.onSave = onSave;

    // Create toolbar
    this.toolbar = this.createToolbar();
    this.container.appendChild(this.toolbar);

    // Create editor container
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'html-editor-wrapper';
    this.container.appendChild(this.editorContainer);

    // Initialize editor with formatted content
    this.initEditor();
  }

  /**
   * Initialize editor with formatted content
   */
  private async initEditor(): Promise<void> {
    const formatted = await this.formatHTML(this.initialContent);
    this.initialContent = formatted;
    this.createEditor();
  }

  /**
   * Create toolbar with format button
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'html-editor-toolbar';

    const formatBtn = document.createElement('button');
    formatBtn.type = 'button';
    formatBtn.className = 'html-format-btn';
    formatBtn.innerHTML = '✨ Auto Format';
    formatBtn.title = 'Format HTML code (Ctrl/Cmd + Shift + F)';
    formatBtn.addEventListener('click', () => {
      this.formatCurrentContent();
    });

    toolbar.appendChild(formatBtn);

    return toolbar;
  }

  /**
   * Format current content in the editor
   */
  public async formatCurrentContent(): Promise<void> {
    if (!this.editorView) return;

    const currentContent = this.getValue();
    const formatted = await this.formatHTML(currentContent);

    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: formatted,
      },
    });
  }

  private createEditor(): void {
    // Create CodeMirror editor with dark theme
    const startState = EditorState.create({
      doc: this.initialContent,
      extensions: [
        // HTML language support
        html(),

        // Dark theme
        oneDark,

        // Key bindings
        keymap.of([
          ...defaultKeymap,
          indentWithTab,
          // Auto-format on Cmd/Ctrl + Shift + F
          {
            key: 'Mod-Shift-f',
            run: () => {
              this.formatCurrentContent();
              return true;
            },
          },
        ]),

        // Auto-save on content change
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Auto-save changes to textarea
            this.save();
          }
        }),

        // Custom styling
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            lineHeight: '1.6',
          },
          '.cm-content': {
            padding: '20px',
          },
          // Highlight text content differently
          '.cm-content .cm-text': {
            color: '#a5d6ff',
          },
          // Make text inside tags stand out
          '.ͼ1': { // HTML text token
            color: '#a5d6ff !important',
            fontWeight: '500',
          },
        }),
      ],
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer,
    });
  }

  /**
   * Format HTML using Prettier
   */
  private async formatHTML(html: string): Promise<string> {
    try {
      const formatted = await prettier.format(html, {
        parser: 'html',
        plugins: [htmlParser],
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        htmlWhitespaceSensitivity: 'css',
      });
      return formatted;
    } catch (error) {
      console.error('Prettier formatting error:', error);
      // Return original HTML if formatting fails
      return html;
    }
  }

  public getValue(): string {
    if (!this.editorView) return '';
    return this.editorView.state.doc.toString();
  }

  public async setValue(html: string): Promise<void> {
    if (!this.editorView) return;

    const formatted = await this.formatHTML(html);
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: formatted,
      },
    });
  }

  public save(): void {
    const html = this.getValue();
    this.onSave(html);
  }

  public focus(): void {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  public destroy(): void {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }

  public show(): void {
    this.container.style.display = 'block';
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public isVisible(): boolean {
    return this.container.style.display !== 'none';
  }
}
