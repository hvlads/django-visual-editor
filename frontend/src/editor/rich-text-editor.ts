import { EditorConfig } from '../types';
import { RichToolbar } from './rich-toolbar';
import { SelectionMenu } from './selection-menu';
import { AIConfig } from './ai-assistant-panel';
import { AIFloatingDialog } from './ai-floating-dialog';

/**
 * Rich Text Editor v2 — single contenteditable document editor.
 * Replaces the block-based editor with a unified writing experience.
 */
export class RichTextEditor {
  private textareaElement: HTMLTextAreaElement;
  private editorDiv: HTMLElement;
  private toolbar: RichToolbar;
  private selectionMenu: SelectionMenu;
  private config: EditorConfig;
  private aiDialog: AIFloatingDialog | null = null;
  private isHTMLMode: boolean = false;
  private lastSelectionRange: Range | null = null;
  private editorBody: HTMLElement;
  private dictation: any = null;
  private isDictating: boolean = false;
  private snapshots: string[] = [];
  private readonly MAX_SNAPSHOTS = 10;

  constructor(editorId: string, textareaId: string, config: EditorConfig) {
    const editorEl = document.getElementById(editorId);
    const textareaEl = document.getElementById(textareaId) as HTMLTextAreaElement;

    if (!editorEl || !textareaEl) throw new Error('RichTextEditor: elements not found');

    this.textareaElement = textareaEl;
    this.config = config;
    this.editorBody = editorEl;

    // Create the contenteditable writing area
    this.editorDiv = document.createElement('div');
    this.editorDiv.className = 'rich-editor-content';
    this.editorDiv.contentEditable = 'true';
    this.editorDiv.setAttribute('spellcheck', 'true');
    if (config.placeholder) {
      this.editorDiv.dataset.placeholder = config.placeholder;
    }

    // Create toolbar
    this.toolbar = new RichToolbar(this.editorDiv);

    // Create selection menu (only useful when AI is enabled)
    this.selectionMenu = new SelectionMenu();

    this.init(editorEl);
  }

  private init(editorEl: HTMLElement): void {
    const container = editorEl.parentElement!; // .visual-editor-container

    // Convert editorEl into the rich editor body
    editorEl.className = 'rich-editor-body';
    editorEl.appendChild(this.editorDiv);

    // Insert toolbar before the container
    container.insertBefore(this.toolbar.getElement(), container.firstChild);

    // Load saved content
    const savedHTML = this.textareaElement.value.trim();
    if (savedHTML) {
      this.editorDiv.innerHTML = savedHTML;
    } else {
      this.editorDiv.innerHTML = '<p><br></p>';
    }

    // Set up AI dialog
    if (this.config.ai?.enabled) {
      this.aiDialog = new AIFloatingDialog(
        this as any, // legacy compatibility
        this.config.ai,
        {
          onInsert: (html) => this.insertAIContent(html),
          onReplace: (html, range) => this.replaceRangeWithAI(html, range!),
        }
      );

      this.toolbar.setAICallback(() => {
        // Use saved range (handles iOS where selection clears before click fires)
        const sel = window.getSelection();
        const hasLiveSelection = sel && sel.toString().trim() && this.isInsideEditor(sel);
        if (hasLiveSelection) {
          this.triggerAIEditFromSelection(sel!);
        } else if (this.lastSelectionRange) {
          const frag = this.lastSelectionRange.cloneContents();
          const div = document.createElement('div');
          div.appendChild(frag);
          this.aiDialog?.showWithSelection(div.innerHTML, this.lastSelectionRange);
          this.lastSelectionRange = null;
        } else {
          this.aiDialog?.show();
        }
      });
    }

    // HTML mode toggle
    this.toolbar.setHTMLModeCallback(() => this.toggleHTMLMode());

    // Fullscreen toggle
    this.toolbar.setFullscreenCallback(() => this.toggleFullscreen());

    // Dictation
    this.setupDictation();

    // Undo AI
    this.toolbar.setUndoAICallback(() => this.undoAI());

    this.setupEventListeners();
    this.updateStats();
  }

  private setupEventListeners(): void {
    // Sync textarea on every edit
    this.editorDiv.addEventListener('input', () => {
      this.updateTextarea();
      this.updateStats();
      this.toolbar.updateButtonStates();
    });

    // Update toolbar button states on cursor move
    this.editorDiv.addEventListener('keyup', () => this.toolbar.updateButtonStates());
    this.editorDiv.addEventListener('click', () => this.toolbar.updateButtonStates());

    // Save selection on every change (needed on iOS where tap clears selection before click)
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && sel.toString().trim() && this.isInsideEditor(sel)) {
        this.lastSelectionRange = sel.getRangeAt(0).cloneRange();
      }
    });

    // Clean paste
    this.editorDiv.addEventListener('paste', (e) => {
      if (this.isHTMLMode) return;
      e.preventDefault();
      const html = e.clipboardData?.getData('text/html') || '';
      const plain = e.clipboardData?.getData('text/plain') || '';

      if (html) {
        document.execCommand('insertHTML', false, this.cleanPastedHTML(html));
      } else {
        document.execCommand('insertText', false, plain);
      }
    });

    // Show selection menu on mouseup (AI mode only)
    if (this.config.ai?.enabled) {
      document.addEventListener('mouseup', () => {
        setTimeout(() => this.checkSelectionForMenu(), 10);
      });

      // ⌘E shortcut to trigger AI edit
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
          const sel = window.getSelection();
          if (sel && sel.toString().trim() && this.isInsideEditor(sel)) {
            e.preventDefault();
            this.triggerAIEditFromSelection(sel);
          }
        }
      });
    }
  }

  private checkSelectionForMenu(): void {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || '';

    if (text.length > 0 && sel?.rangeCount && this.isInsideEditor(sel)) {
      this.selectionMenu.show((html, range) => {
        this.aiDialog?.showWithSelection(html, range);
      });
    } else {
      if (!this.selectionMenu.isVisible()) return;
      // Keep visible briefly to allow click
    }
  }

  private triggerAIEditFromSelection(sel: Selection): void {
    const range = sel.getRangeAt(0).cloneRange();
    const frag = range.cloneContents();
    const div = document.createElement('div');
    div.appendChild(frag);
    const html = div.innerHTML;

    this.selectionMenu.hide();
    this.aiDialog?.showWithSelection(html, range);
  }

  private isInsideEditor(sel: Selection): boolean {
    if (!sel.rangeCount) return false;
    return this.editorDiv.contains(sel.getRangeAt(0).commonAncestorContainer);
  }

  private updateTextarea(): void {
    this.textareaElement.value = this.isHTMLMode
      ? this.editorDiv.innerText
      : this.editorDiv.innerHTML;
  }

  private updateStats(): void {
    const text = (this.editorDiv.textContent || '').trim();
    const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    this.toolbar.updateStats(words, text.length);
  }

  private cleanPastedHTML(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Remove scripts and styles
    div.querySelectorAll('script, style, [style]').forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
        el.remove();
      } else {
        (el as HTMLElement).removeAttribute('style');
      }
    });
    // Remove class attrs from non-semantic elements
    div.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    return div.innerHTML;
  }

  private takeSnapshot(): void {
    this.snapshots.push(this.editorDiv.innerHTML);
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
    this.toolbar.showUndoAI(this.snapshots.length);
  }

  private undoAI(): void {
    if (this.snapshots.length === 0) return;
    this.editorDiv.innerHTML = this.snapshots.pop()!;
    this.updateTextarea();
    this.updateStats();
    this.toolbar.showUndoAI(this.snapshots.length);
  }

  insertAIContent(html: string): void {
    this.takeSnapshot();
    this.editorDiv.focus();
    document.execCommand('insertHTML', false, html);
    this.updateTextarea();
    this.updateStats();
  }

  replaceRangeWithAI(html: string, range: Range): void {
    this.takeSnapshot();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertHTML', false, html);
    this.updateTextarea();
    this.updateStats();
  }

  private toggleHTMLMode(): void {
    if (this.isHTMLMode) {
      this.switchToVisual();
    } else {
      this.switchToHTML();
    }
  }

  private switchToHTML(): void {
    const source = this.editorDiv.innerHTML;
    this.editorDiv.className = 'rich-html-editor';
    this.editorDiv.innerText = source;
    this.editorDiv.focus();
    this.isHTMLMode = true;
    this.toolbar.setHTMLModeActive(true);
  }

  private switchToVisual(): void {
    const html = this.editorDiv.innerText;
    this.editorDiv.className = 'rich-editor-content';
    this.editorDiv.innerHTML = html;
    this.isHTMLMode = false;
    this.updateTextarea();
    this.updateStats();
    this.toolbar.setHTMLModeActive(false);
  }

  private setupDictation(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      this.toolbar.setDictateSupported(false);
      return;
    }

    this.dictation = new SR();
    this.dictation.continuous = false; // iOS WebKit doesn't support continuous
    this.dictation.interimResults = true;
    this.dictation.lang = navigator.language || 'ru-RU';

    this.dictation.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (final) {
        this.editorDiv.focus();
        document.execCommand('insertText', false, final + ' ');
        this.updateTextarea();
        this.updateStats();
      }
    };

    this.dictation.onend = () => {
      // Auto-restart while dictating (makes it feel continuous)
      if (this.isDictating) {
        setTimeout(() => {
          if (this.isDictating) {
            try { this.dictation.start(); } catch {}
          }
        }, 150);
      }
    };

    this.dictation.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        // Restart on silence
        if (this.isDictating) {
          try { this.dictation.start(); } catch {}
        }
        return;
      }
      this.stopDictation();
    };

    this.toolbar.setDictateCallback(() => this.toggleDictation());
  }

  private toggleDictation(): void {
    if (this.isDictating) {
      this.stopDictation();
    } else {
      this.isDictating = true;
      this.toolbar.setDictateActive(true);
      this.editorDiv.focus();
      try { this.dictation.start(); } catch {}
    }
  }

  private stopDictation(): void {
    this.isDictating = false;
    this.toolbar.setDictateActive(false);
    try { this.dictation.stop(); } catch {}
  }

  private handleFullscreenEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.exitFullscreen();
  };

  private toggleFullscreen(): void {
    const container = this.editorBody.parentElement!;
    if (container.classList.contains('fullscreen')) {
      this.exitFullscreen();
    } else {
      container.classList.add('fullscreen');
      this.toolbar.setFullscreenActive(true);
      document.addEventListener('keydown', this.handleFullscreenEscape);
      setTimeout(() => this.editorDiv.focus(), 50);
    }
  }

  private exitFullscreen(): void {
    const container = this.editorBody.parentElement!;
    container.classList.remove('fullscreen');
    this.toolbar.setFullscreenActive(false);
    document.removeEventListener('keydown', this.handleFullscreenEscape);
  }

  toHTML(): string {
    return this.editorDiv.innerHTML;
  }
}
