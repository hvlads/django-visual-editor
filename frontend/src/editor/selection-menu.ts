/**
 * Selection menu — dark popup that appears when text is selected inside the editor.
 * Range and HTML are saved at show() time so clicks don't lose the selection.
 */
export class SelectionMenu {
  private element: HTMLElement;
  private visible: boolean = false;
  private savedCallback: (() => void) | null = null;

  constructor() {
    this.element = this.build();
    document.body.appendChild(this.element);
    this.bindOutsideClick();
  }

  private build(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'selection-menu';
    el.style.display = 'none';
    el.innerHTML = `
      <button type="button" class="sel-btn" data-action="ai-edit">
        <span class="sel-icon">✦</span>
        Edit
        <kbd class="sel-kbd">⌘E</kbd>
      </button>
    `;

    // Prevent mousedown from stealing focus / clearing selection
    el.addEventListener('mousedown', (e) => e.preventDefault());

    el.querySelector('[data-action="ai-edit"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
      // Call the saved callback (range already captured at show() time)
      if (this.savedCallback) this.savedCallback();
    });

    return el;
  }

  private bindOutsideClick(): void {
    document.addEventListener('mousedown', (e) => {
      if (this.visible && !this.element.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  /**
   * Show the popup below the selection.
   * Range and HTML are captured here, before the user can lose the selection.
   */
  show(onAIEdit: (html: string, range: Range) => void): void {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    // Capture range + HTML now, before any interaction
    const savedRange = range.cloneRange();
    const fragment = savedRange.cloneContents();
    const div = document.createElement('div');
    div.appendChild(fragment);
    const html = div.innerHTML;

    this.savedCallback = () => onAIEdit(html, savedRange);

    // Use fixed positioning relative to viewport
    const cx = rect.left + rect.width / 2;
    const cy = rect.bottom + 8;

    this.element.style.display = 'flex';
    this.element.style.position = 'fixed';
    this.element.style.left = `${cx}px`;
    this.element.style.top = `${cy}px`;
    this.element.style.transform = 'translateX(-50%)';
    this.element.style.zIndex = '9980';

    this.visible = true;
  }

  hide(): void {
    this.element.style.display = 'none';
    this.savedCallback = null;
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }
}
