import { BaseBlock } from '../blocks/base-block';

/**
 * Text toolbar that appears when text is selected
 * Handles inline formatting: bold, italic, underline, links
 */
export class TextToolbar {
  private element: HTMLElement;
  private currentBlock: BaseBlock | null = null;
  private savedSelection: Range | null = null;
  private linkDialogOpen: boolean = false;

  constructor() {
    this.element = this.createToolbar();
    document.body.appendChild(this.element);
    this.attachEvents();
  }

  /**
   * Create the toolbar element
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'text-toolbar';
    toolbar.style.display = 'none';

    toolbar.innerHTML = `
      <!-- Text Formatting -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-format="bold" title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" class="toolbar-btn" data-format="italic" title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" class="toolbar-btn" data-format="underline" title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Link -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-action="link" title="Insert Link">
          🔗
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Size -->
      <div class="toolbar-group">
        <select class="toolbar-select size-select" title="Font Size">
          <option value="">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
        </select>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Color -->
      <div class="toolbar-group">
        <select class="toolbar-select color-select" title="Text Color">
          <option value="">Color</option>
          <option value="#000000">⚫ Black</option>
          <option value="#3b82f6">🔵 Blue</option>
          <option value="#16a34a">🟢 Green</option>
          <option value="#dc2626">🔴 Red</option>
          <option value="#ca8a04">🟡 Yellow</option>
          <option value="#8b5cf6">🟣 Purple</option>
        </select>
      </div>

      <!-- Link Dialog -->
      <div class="link-dialog" style="display: none;">
        <input type="url" class="link-input" placeholder="Enter URL...">
        <button type="button" class="btn-confirm">✓</button>
        <button type="button" class="btn-cancel">✗</button>
      </div>
    `;

    return toolbar;
  }

  /**
   * Attach event listeners
   */
  private attachEvents(): void {
    // Text formatting buttons
    const formatButtons = this.element.querySelectorAll('[data-format]');
    formatButtons.forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        // Prevent default to keep text selection
        e.preventDefault();
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const format = (e.currentTarget as HTMLElement).dataset.format;
        if (format) this.applyFormat(format);
      });
    });

    // Link button
    const linkBtn = this.element.querySelector('[data-action="link"]');
    linkBtn?.addEventListener('mousedown', (e) => {
      // Prevent default to keep text selection
      e.preventDefault();
    });
    linkBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showLinkDialog();
    });

    // Link dialog
    const confirmBtn = this.element.querySelector('.btn-confirm');
    const cancelBtn = this.element.querySelector('.btn-cancel');
    const linkInput = this.element.querySelector('.link-input') as HTMLInputElement;

    confirmBtn?.addEventListener('click', () => {
      this.insertLink(linkInput.value);
      this.hideLinkDialog();
    });

    cancelBtn?.addEventListener('click', () => {
      this.hideLinkDialog();
    });

    // Size select
    const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
    sizeSelect?.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    sizeSelect?.addEventListener('change', () => {
      this.applySize(sizeSelect.value);
    });

    // Color select
    const colorSelect = this.element.querySelector('.color-select') as HTMLSelectElement;
    colorSelect?.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    colorSelect?.addEventListener('change', () => {
      this.applyColor(colorSelect.value);
    });

    // Enter key in link input
    linkInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.insertLink(linkInput.value);
        this.hideLinkDialog();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideLinkDialog();
      }
    });
  }

  /**
   * Show toolbar for selected text
   */
  show(block: BaseBlock, selection: Selection): void {
    this.currentBlock = block;
    this.element.style.display = 'flex';
    this.positionToolbar(selection);
  }

  /**
   * Hide toolbar
   */
  hide(): void {
    this.element.style.display = 'none';
    this.currentBlock = null;
    this.savedSelection = null;
  }

  /**
   * Position toolbar near the text selection
   */
  private positionToolbar(selection: Selection): void {
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position above the selection
    this.element.style.position = 'fixed';
    this.element.style.top = `${rect.top - 45}px`;
    this.element.style.left = `${rect.left}px`;
    this.element.style.zIndex = '1000';
  }

  /**
   * Apply text formatting using document.execCommand
   */
  private applyFormat(format: string): void {
    if (!this.currentBlock) return;

    // Restore selection if needed
    if (this.savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedSelection);
    }

    // Apply formatting
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
    }

    // Trigger change
    this.currentBlock.triggerChange();
  }

  /**
   * Show link dialog
   */
  private showLinkDialog(): void {
    // Save current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedSelection = selection.getRangeAt(0).cloneRange();
    }

    const dialog = this.element.querySelector('.link-dialog') as HTMLElement;
    dialog.style.display = 'flex';
    this.linkDialogOpen = true;

    const input = dialog.querySelector('.link-input') as HTMLInputElement;

    // Check if selected text is already a link and populate the input
    if (this.savedSelection) {
      const container = this.savedSelection.commonAncestorContainer;
      const linkElement = container.nodeType === 3
        ? (container.parentElement?.closest('a') as HTMLAnchorElement)
        : (container as HTMLElement).closest('a');

      if (linkElement) {
        input.value = linkElement.href;
      } else {
        input.value = '';
      }
    }

    input.focus();
    input.select();
  }

  /**
   * Hide link dialog
   */
  private hideLinkDialog(): void {
    const dialog = this.element.querySelector('.link-dialog') as HTMLElement;
    dialog.style.display = 'none';
    this.linkDialogOpen = false;

    const input = dialog.querySelector('.link-input') as HTMLInputElement;
    input.value = '';
  }

  /**
   * Insert link
   */
  private insertLink(url: string): void {
    if (!url || !this.currentBlock) return;

    // Restore saved selection
    if (!this.savedSelection) return;

    const selection = window.getSelection();
    if (!selection) return;

    // Restore the saved selection
    selection.removeAllRanges();
    selection.addRange(this.savedSelection);

    // Get selected text
    let selectedText = this.savedSelection.toString();

    // If no text is selected, use the URL as the link text
    if (!selectedText || selectedText.trim() === '') {
      selectedText = url;
    }

    // Check if we're editing an existing link
    const container = this.savedSelection.commonAncestorContainer;
    const existingLink = container.nodeType === 3
      ? (container.parentElement?.closest('a') as HTMLAnchorElement)
      : (container as HTMLElement).closest('a');

    if (existingLink) {
      // Update existing link
      existingLink.href = url;
    } else {
      // Create new link element
      const link = document.createElement('a');
      link.href = url;
      link.textContent = selectedText;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // Delete the selected content and insert the link
      this.savedSelection.deleteContents();
      this.savedSelection.insertNode(link);

      // Move cursor after the link
      const range = document.createRange();
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Trigger change event to save the content
    this.currentBlock.triggerChange();

    // Clear saved selection
    this.savedSelection = null;
  }

  /**
   * Apply font size to selected text
   */
  private applySize(size: string): void {
    if (!size) return;

    // Restore selection if needed
    if (this.savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedSelection);
    }

    // Wrap selection in span with font-size
    document.execCommand('fontSize', false, '7');

    // Find and update the font tags
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const container = selection.getRangeAt(0).commonAncestorContainer;
      const parent = container.nodeType === 3 ? container.parentElement : container as HTMLElement;
      const fontTags = parent?.querySelectorAll('font[size="7"]') || [];

      fontTags.forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.innerHTML = font.innerHTML;
        font.replaceWith(span);
      });
    }

    this.currentBlock?.triggerChange();
  }

  /**
   * Apply color to selected text
   */
  private applyColor(color: string): void {
    if (!color) return;

    // Restore selection if needed
    if (this.savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedSelection);
    }

    // Apply color
    document.execCommand('foreColor', false, color);

    this.currentBlock?.triggerChange();
  }
}
