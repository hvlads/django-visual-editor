export class PasteModal {
  private modal: HTMLElement;
  private overlay: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private onInsert: (content: string) => void;

  constructor(onInsert: (content: string) => void) {
    this.onInsert = onInsert;
    this.overlay = this.createOverlay();
    this.modal = this.createModal();
    this.textarea = this.modal.querySelector('.paste-modal-textarea') as HTMLTextAreaElement;
    this.attachEvents();
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'paste-modal-overlay';
    return overlay;
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'paste-modal';
    modal.innerHTML = `
      <div class="paste-modal-header">
        <h3>Paste Content</h3>
        <button class="paste-modal-close" type="button">×</button>
      </div>
      <div class="paste-modal-body">
        <textarea
          class="paste-modal-textarea"
          placeholder="Paste your HTML code or plain text here..."
          spellcheck="false"
        ></textarea>
        <div class="paste-modal-hint">
          ✨ Smart paste: Automatically detects HTML or text and creates appropriate blocks
        </div>
      </div>
      <div class="paste-modal-footer">
        <button class="paste-modal-btn paste-modal-btn-secondary" data-action="cancel">
          Cancel
        </button>
        <button class="paste-modal-btn paste-modal-btn-primary" data-action="insert">
          ✅ Insert (Enter)
        </button>
      </div>
    `;
    return modal;
  }

  private attachEvents(): void {
    // Close button
    const closeBtn = this.modal.querySelector('.paste-modal-close') as HTMLElement;
    closeBtn.addEventListener('click', () => this.close());

    // Overlay click to close
    this.overlay.addEventListener('click', () => this.close());

    // Action buttons
    const cancelBtn = this.modal.querySelector('[data-action="cancel"]') as HTMLElement;
    const insertBtn = this.modal.querySelector('[data-action="insert"]') as HTMLElement;

    cancelBtn.addEventListener('click', () => this.close());
    insertBtn.addEventListener('click', () => this.insert());

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Enter to insert
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.insert();
      }
    });
  }

  private insert(): void {
    const content = this.textarea.value.trim();
    if (!content) {
      alert('Please enter some content first.');
      return;
    }
    this.onInsert(content);
    this.close();
  }

  public open(): void {
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);

    // Trigger reflow for animation
    setTimeout(() => {
      this.overlay.classList.add('paste-modal-overlay-visible');
      this.modal.classList.add('paste-modal-visible');
      this.textarea.focus();
    }, 10);
  }

  public close(): void {
    this.overlay.classList.remove('paste-modal-overlay-visible');
    this.modal.classList.remove('paste-modal-visible');

    setTimeout(() => {
      if (this.overlay.parentElement) {
        document.body.removeChild(this.overlay);
      }
      if (this.modal.parentElement) {
        document.body.removeChild(this.modal);
      }
      this.textarea.value = '';
    }, 300);
  }

  public isOpen(): boolean {
    return this.modal.parentElement !== null;
  }

  public destroy(): void {
    this.close();
  }
}
