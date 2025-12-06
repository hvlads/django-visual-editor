import { BaseBlock } from '../blocks/base-block';

/**
 * Contextual toolbar that appears when a block is selected
 */
export class ContextualToolbar {
  private element: HTMLElement;
  private currentBlock: BaseBlock | null = null;
  private linkDialogOpen: boolean = false;
  private savedSelection: Range | null = null;

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
    toolbar.className = 'contextual-toolbar';
    toolbar.style.display = 'none';

    toolbar.innerHTML = `
      <!-- Alignment -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-align="left" title="Align Left">
          ⬅️
        </button>
        <button type="button" class="toolbar-btn" data-align="center" title="Align Center">
          ↔️
        </button>
        <button type="button" class="toolbar-btn" data-align="right" title="Align Right">
          ➡️
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Visual/HTML Toggle -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn-toggle active" data-mode="visual" title="Visual Mode">
          👁️ Visual
        </button>
        <button type="button" class="toolbar-btn-toggle" data-mode="html" title="HTML Mode">
          💻 HTML
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Delete -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn-danger" data-action="delete" title="Delete Block">
          🗑️ Delete
        </button>
      </div>
    `;

    return toolbar;
  }

  /**
   * Attach event listeners
   */
  private attachEvents(): void {
    // Alignment buttons
    const alignButtons = this.element.querySelectorAll('[data-align]');
    alignButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const align = (e.currentTarget as HTMLElement).dataset.align;
        if (align) this.applyAlignment(align);
      });
    });

    // Visual/HTML toggle
    const modeButtons = this.element.querySelectorAll('[data-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode;
        if (mode) this.toggleMode(mode);
      });
    });

    // Delete button
    const deleteBtn = this.element.querySelector('[data-action="delete"]');
    deleteBtn?.addEventListener('click', () => {
      if (this.currentBlock) {
        this.currentBlock.delete();
        this.hide();
      }
    });
  }

  /**
   * Show toolbar for a block
   */
  show(block: BaseBlock): void {
    this.currentBlock = block;
    this.element.style.display = 'flex';
    this.updateButtonStates();
    this.positionToolbar(block);
  }

  /**
   * Hide toolbar
   */
  hide(): void {
    this.element.style.display = 'none';
    this.currentBlock = null;
  }

  /**
   * Position toolbar near the selected block or text selection
   */
  private positionToolbar(block: BaseBlock): void {
    let rect: DOMRect;

    // Check if there's a text selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      // Position near the text selection
      const range = selection.getRangeAt(0);
      rect = range.getBoundingClientRect();
    } else {
      // Position near the block
      const blockEl = block.getElement();
      rect = blockEl.getBoundingClientRect();
    }

    // Position above the selection/block
    this.element.style.position = 'fixed';
    this.element.style.top = `${rect.top - 50}px`;
    this.element.style.left = `${rect.left}px`;
    this.element.style.zIndex = '1000';
  }

  /**
   * Apply text formatting
   */
  private applyFormat(format: string): void {
    if (!this.currentBlock) return;

    const currentStyles = this.currentBlock.getData().inlineStyles || {};

    switch (format) {
      case 'bold':
        if (currentStyles.fontWeight === 'bold') {
          this.currentBlock.removeInlineStyle('fontWeight');
        } else {
          this.currentBlock.setInlineStyle('fontWeight', 'bold');
        }
        break;

      case 'italic':
        if (currentStyles.fontStyle === 'italic') {
          this.currentBlock.removeInlineStyle('fontStyle');
        } else {
          this.currentBlock.setInlineStyle('fontStyle', 'italic');
        }
        break;

      case 'underline':
        if (currentStyles.textDecoration === 'underline') {
          this.currentBlock.removeInlineStyle('textDecoration');
        } else {
          this.currentBlock.setInlineStyle('textDecoration', 'underline');
        }
        break;
    }

    this.updateButtonStates();
  }

  /**
   * Apply alignment
   */
  private applyAlignment(align: string): void {
    if (!this.currentBlock) return;

    this.currentBlock.setInlineStyle('textAlign', align as 'left' | 'center' | 'right' | 'justify');
    this.updateButtonStates();
  }

  /**
   * Apply font size
   */
  private applySize(sizeClass: string): void {
    if (!this.currentBlock) return;

    // Map Tailwind-style classes to actual sizes
    const sizeMap: Record<string, string> = {
      'text-sm': '0.875rem',
      'text-base': '1rem',
      'text-lg': '1.125rem',
      'text-xl': '1.25rem',
      'text-2xl': '1.5rem'
    };

    if (sizeClass && sizeMap[sizeClass]) {
      this.currentBlock.setInlineStyle('fontSize', sizeMap[sizeClass]);
    } else {
      this.currentBlock.removeInlineStyle('fontSize');
    }
  }

  /**
   * Apply color
   */
  private applyColor(colorClass: string): void {
    if (!this.currentBlock) return;

    // Map Tailwind-style color classes to actual colors
    const colorMap: Record<string, string> = {
      'text-gray-900': '#111827',
      'text-blue-600': '#2563eb',
      'text-green-600': '#16a34a',
      'text-red-600': '#dc2626',
      'text-yellow-600': '#ca8a04'
    };

    if (colorClass && colorMap[colorClass]) {
      this.currentBlock.setInlineStyle('color', colorMap[colorClass]);
    } else {
      this.currentBlock.removeInlineStyle('color');
    }
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
      }
    }

    input.focus();
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

    // Clear saved selection
    this.savedSelection = null;
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
  }

  /**
   * Toggle Visual/HTML mode
   */
  private toggleMode(mode: string): void {
    const buttons = this.element.querySelectorAll('[data-mode]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
    });

    if (mode === 'html' && this.currentBlock) {
      this.showHTMLEditor();
    } else {
      this.showVisualEditor();
    }
  }

  /**
   * Show HTML editor for current block
   */
  private showHTMLEditor(): void {
    if (!this.currentBlock) return;

    const blockEl = this.currentBlock.getElement();
    const contentEl = blockEl.querySelector('.block-content');

    if (contentEl) {
      // Check if already in HTML mode
      if (contentEl.querySelector('textarea.html-editor')) {
        return;
      }

      // Get the current innerHTML from the editable element to preserve links
      const editableElement = contentEl.querySelector('[data-editable]');
      let html: string;

      if (editableElement) {
        // Get the actual HTML from the editable element
        html = editableElement.innerHTML;

        // Wrap it in the appropriate tag based on block type
        const blockData = this.currentBlock.getData();
        const classes = blockData.styles.length > 0 ? ` class="${blockData.styles.join(' ')}"` : '';
        const inlineStyles = this.currentBlock['stylesToString'] ? this.currentBlock['stylesToString']() : '';

        if (blockData.type === 'heading' && blockData.metadata?.level) {
          const level = blockData.metadata.level;
          html = `<h${level}${classes}${inlineStyles}>${html}</h${level}>`;
        } else if (blockData.type === 'quote') {
          html = `<blockquote${classes}${inlineStyles}>${html}</blockquote>`;
        } else {
          html = `<p${classes}${inlineStyles}>${html}</p>`;
        }
      } else {
        // Fallback to toHTML() method
        html = this.currentBlock.toHTML();
      }

      const textarea = document.createElement('textarea');
      textarea.className = 'html-editor';
      textarea.value = html;
      textarea.rows = 10;
      textarea.style.width = '100%';
      textarea.style.minHeight = '200px';
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '14px';
      textarea.style.padding = '10px';
      textarea.style.border = '1px solid #e5e7eb';
      textarea.style.borderRadius = '4px';
      textarea.style.backgroundColor = '#f9fafb';
      textarea.style.color = '#1f2937';
      textarea.style.resize = 'vertical';
      textarea.style.boxSizing = 'border-box';
      textarea.style.display = 'block';

      contentEl.innerHTML = '';
      contentEl.appendChild(textarea);
      textarea.focus();
    }
  }

  /**
   * Show visual editor
   */
  private showVisualEditor(): void {
    if (!this.currentBlock) return;

    const blockEl = this.currentBlock.getElement();
    const contentEl = blockEl.querySelector('.block-content');
    const textarea = contentEl?.querySelector('textarea.html-editor') as HTMLTextAreaElement;

    if (textarea) {
      const html = textarea.value.trim();

      // Parse the HTML to extract inner content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Find the main content element (p, h1-h6, blockquote, etc.)
      const mainElement = tempDiv.querySelector('p, h1, h2, h3, h4, h5, h6, blockquote');
      const innerContent = mainElement ? mainElement.innerHTML : html;

      // Re-render the block with the new content
      const blockData = this.currentBlock.getData();

      // Store the inner HTML content
      if (typeof blockData.content === 'string') {
        blockData.content = innerContent;
      }

      // Re-render the block content
      contentEl!.innerHTML = this.currentBlock['renderContent']();

      // Re-attach event listeners
      this.currentBlock['setupContentEditing']();

      this.currentBlock.triggerChange();
    }
  }

  /**
   * Update button states based on current block
   */
  private updateButtonStates(): void {
    if (!this.currentBlock) return;

    const inlineStyles = this.currentBlock.getData().inlineStyles || {};

    // Update format buttons
    const formatButtons = this.element.querySelectorAll('[data-format]');
    formatButtons.forEach(btn => {
      const format = (btn as HTMLElement).dataset.format;
      let isActive = false;

      switch (format) {
        case 'bold':
          isActive = inlineStyles.fontWeight === 'bold';
          break;
        case 'italic':
          isActive = inlineStyles.fontStyle === 'italic';
          break;
        case 'underline':
          isActive = inlineStyles.textDecoration === 'underline';
          break;
      }

      btn.classList.toggle('active', isActive);
    });

    // Update alignment buttons
    const alignButtons = this.element.querySelectorAll('[data-align]');
    alignButtons.forEach(btn => {
      const align = (btn as HTMLElement).dataset.align;
      btn.classList.toggle('active', inlineStyles.textAlign === align);
    });

    // Update size select
    const sizeSelect = this.element.querySelector('.size-select') as HTMLSelectElement;
    const sizeMap: Record<string, string> = {
      '0.875rem': 'text-sm',
      '1rem': 'text-base',
      '1.125rem': 'text-lg',
      '1.25rem': 'text-xl',
      '1.5rem': 'text-2xl'
    };
    const sizeClass = inlineStyles.fontSize ? sizeMap[inlineStyles.fontSize] || '' : '';
    if (sizeSelect) {
      sizeSelect.value = sizeClass;
    }

    // Update color select
    const colorSelect = this.element.querySelector('.color-select') as HTMLSelectElement;
    const colorMap: Record<string, string> = {
      '#111827': 'text-gray-900',
      '#2563eb': 'text-blue-600',
      '#16a34a': 'text-green-600',
      '#dc2626': 'text-red-600',
      '#ca8a04': 'text-yellow-600'
    };
    const colorClass = inlineStyles.color ? colorMap[inlineStyles.color] || 'text-gray-900' : 'text-gray-900';
    if (colorSelect) {
      colorSelect.value = colorClass;
    }
  }
}