/**
 * Persistent top toolbar for the rich text editor
 */
export class RichToolbar {
  private element: HTMLElement;
  private editorDiv: HTMLElement;
  private onHTMLMode: (() => void) | null = null;
  private onAIOpen: (() => void) | null = null;
  private onFullscreen: (() => void) | null = null;
  private onDictate: (() => void) | null = null;
  private onUndoAI: (() => void) | null = null;

  constructor(editorDiv: HTMLElement) {
    this.editorDiv = editorDiv;
    this.element = this.build();
    this.bindEvents();
  }

  private build(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'rich-toolbar';
    el.innerHTML = `
      <div class="rt-left">
        <span class="rt-stats">
          <span class="rt-words">0 words</span>
          <span class="rt-sep">·</span>
          <span class="rt-chars">0 chars</span>
        </span>
      </div>

      <div class="rt-center">
        <select class="rt-select" data-action="block-style" title="Paragraph style">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code block</option>
        </select>

        <div class="rt-sep-line"></div>

        <button type="button" class="rt-btn" data-cmd="bold" title="Bold (⌘B)"><b>B</b></button>
        <button type="button" class="rt-btn" data-cmd="italic" title="Italic (⌘I)"><i>I</i></button>
        <button type="button" class="rt-btn" data-cmd="underline" title="Underline (⌘U)"><u>U</u></button>
        <button type="button" class="rt-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>

        <div class="rt-sep-line"></div>

        <button type="button" class="rt-btn" data-action="link" title="Link (⌘K)">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M4.5 7.5h6M8.5 4.5l2.5 2.5-2.5 2.5M6.5 4.5L4 7l2.5 2.5" stroke="none"/><path d="M6 5.5a2.5 2.5 0 0 0-3.536 3.536l1.5 1.5a2.5 2.5 0 0 0 3.536-3.536L7 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M9 9.5a2.5 2.5 0 0 0 3.536-3.536l-1.5-1.5A2.5 2.5 0 0 0 7.5 7.999L8 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button type="button" class="rt-btn rt-btn-code" data-action="code" title="Inline code">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5 4L1.5 7.5 5 11M10 4l3.5 3.5L10 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

        <div class="rt-sep-line"></div>

        <button type="button" class="rt-btn" data-cmd="insertUnorderedList" title="Bullet list">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="2.5" cy="4.5" r="1" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1" fill="currentColor"/><circle cx="2.5" cy="10.5" r="1" fill="currentColor"/><path d="M5.5 4.5h7M5.5 7.5h7M5.5 10.5h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button type="button" class="rt-btn" data-cmd="insertOrderedList" title="Numbered list">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3.5h1.5v4M2 7.5h2M2 10.5c0-.8.667-1.5 1.5-1.5s1.5.7 1.5 1.5c0 .5-.3.9-1.5 2H5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 4.5h5.5M7.5 7.5h5.5M7.5 10.5h5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>

        <div class="rt-sep-line"></div>

        <button type="button" class="rt-btn" data-cmd="removeFormat" title="Clear formatting">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 3l9 9M3 12h4.5M8.5 3H12L9 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

        <div class="rt-sep-line"></div>

        <button type="button" class="rt-btn" data-cmd="undo" title="Undo (⌘Z)">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7A4.5 4.5 0 1 1 8 11.5H5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3.5 4.5v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="rt-btn" data-cmd="redo" title="Redo (⌘⇧Z)">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M11.5 7A4.5 4.5 0 1 0 7 11.5H9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M11.5 4.5v3h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

      </div>

      <div class="rt-right">
        <button type="button" class="rt-btn-undo-ai" data-action="undo-ai" style="display:none" title="Откатить AI-правку">
          ↩ Откатить
        </button>
        <button type="button" class="rt-btn-ai" data-action="ai" style="display:none" title="Ask AI (⌘E)">
          ✦ Ask AI
        </button>
        <button type="button" class="rt-btn-secondary" data-action="html-mode" title="HTML source">
          &lt;/&gt;
        </button>
        <button type="button" class="rt-btn-secondary rt-btn-fullscreen" data-action="fullscreen" title="Fullscreen (F11)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-expand">
            <path d="M1 5V1H5M9 1H13V5M13 9V13H9M5 13H1V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-compress" style="display:none">
            <path d="M5 1V5H1M13 5H9V1M9 13V9H13M1 9H5V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
    return el;
  }

  private bindEvents(): void {
    // Prevent toolbar from stealing focus (desktop only — don't block touch)
    this.element.addEventListener('mousedown', (e) => {
      if ((e as any).pointerType === 'touch') return;
      if (!(e.target as HTMLElement).matches('select, input, textarea')) {
        e.preventDefault();
      }
    });

    // execCommand buttons
    this.element.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = (btn as HTMLElement).dataset.cmd!;
        this.editorDiv.focus();
        document.execCommand(cmd, false);
        this.editorDiv.dispatchEvent(new Event('input'));
      });
    });

    // Block style dropdown
    const styleSelect = this.element.querySelector('[data-action="block-style"]') as HTMLSelectElement;
    styleSelect?.addEventListener('change', () => {
      this.editorDiv.focus();
      const val = styleSelect.value;
      document.execCommand('formatBlock', false, `<${val}>`);
      this.editorDiv.dispatchEvent(new Event('input'));
      setTimeout(() => { styleSelect.value = 'p'; }, 50);
    });

    // Link
    this.element.querySelector('[data-action="link"]')?.addEventListener('click', () => {
      const sel = window.getSelection();
      const existing = sel?.anchorNode?.parentElement?.closest('a') as HTMLAnchorElement | null;
      const url = prompt('Enter URL:', existing?.href || 'https://');
      if (url) {
        this.editorDiv.focus();
        document.execCommand('createLink', false, url);
        // Ensure new tab
        this.editorDiv.querySelectorAll('a:not([target])').forEach(a => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });
        this.editorDiv.dispatchEvent(new Event('input'));
      }
    });

    // Inline code
    this.element.querySelector('[data-action="code"]')?.addEventListener('click', () => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!range.toString()) return;
      const code = document.createElement('code');
      range.surroundContents(code);
      this.editorDiv.dispatchEvent(new Event('input'));
    });

    // HTML mode
    this.element.querySelector('[data-action="html-mode"]')?.addEventListener('click', () => {
      this.onHTMLMode?.();
    });

    // AI button
    this.element.querySelector('[data-action="ai"]')?.addEventListener('click', () => {
      this.onAIOpen?.();
    });

    // Fullscreen
    this.element.querySelector('[data-action="fullscreen"]')?.addEventListener('click', () => {
      this.onFullscreen?.();
    });

    // Dictate
    this.element.querySelector('[data-action="dictate"]')?.addEventListener('click', () => {
      this.onDictate?.();
    });

    // Undo AI
    this.element.querySelector('[data-action="undo-ai"]')?.addEventListener('click', () => {
      this.onUndoAI?.();
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }

  setHTMLModeCallback(fn: () => void): void {
    this.onHTMLMode = fn;
  }

  setFullscreenCallback(fn: () => void): void {
    this.onFullscreen = fn;
  }

  setDictateCallback(fn: () => void): void {
    this.onDictate = fn;
  }

  setDictateActive(active: boolean): void {
    const btn = this.element.querySelector('[data-action="dictate"]') as HTMLElement;
    if (btn) btn.classList.toggle('recording', active);
  }

  setUndoAICallback(fn: () => void): void {
    this.onUndoAI = fn;
  }

  showUndoAI(count: number): void {
    const btn = this.element.querySelector('[data-action="undo-ai"]') as HTMLElement;
    if (!btn) return;
    if (count > 0) {
      btn.style.display = 'inline-flex';
      btn.textContent = count > 1 ? `↩ Откатить (${count})` : '↩ Откатить';
    } else {
      btn.style.display = 'none';
    }
  }

  setDictateSupported(supported: boolean): void {
    const btn = this.element.querySelector('[data-action="dictate"]') as HTMLElement;
    if (!btn) return;
    if (!supported) {
      btn.style.opacity = '0.35';
      btn.title = 'Speech recognition requires HTTPS';
    }
  }

  setFullscreenActive(active: boolean): void {
    const btn = this.element.querySelector('[data-action="fullscreen"]');
    if (!btn) return;
    btn.classList.toggle('active', active);
    (btn.querySelector('.icon-expand') as HTMLElement).style.display = active ? 'none' : '';
    (btn.querySelector('.icon-compress') as HTMLElement).style.display = active ? '' : 'none';
  }

  setAICallback(fn: () => void): void {
    this.onAIOpen = fn;
    const aiBtn = this.element.querySelector('[data-action="ai"]') as HTMLElement;
    if (aiBtn) aiBtn.style.display = 'inline-flex';
  }

  setHTMLModeActive(active: boolean): void {
    const btn = this.element.querySelector('[data-action="html-mode"]') as HTMLElement;
    if (btn) btn.textContent = active ? 'Visual' : '</>';
    btn?.classList.toggle('active', active);
  }

  updateStats(words: number, chars: number): void {
    const w = this.element.querySelector('.rt-words');
    const c = this.element.querySelector('.rt-chars');
    if (w) w.textContent = `${words} words`;
    if (c) c.textContent = `${chars} chars`;
  }

  updateButtonStates(): void {
    const cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
    cmds.forEach(cmd => {
      const btn = this.element.querySelector(`[data-cmd="${cmd}"]`);
      if (btn) {
        try {
          btn.classList.toggle('active', document.queryCommandState(cmd));
        } catch {
          // ignore
        }
      }
    });
  }
}
