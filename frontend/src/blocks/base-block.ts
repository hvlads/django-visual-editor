import { BlockData, BlockType } from './types';

/**
 * Base class for all block types
 */
export abstract class BaseBlock {
  protected data: BlockData;
  protected element: HTMLElement;
  protected contentElement: HTMLElement | null = null;
  protected onSelectCallback?: (block: BaseBlock) => void;
  protected onChangeCallback?: () => void;

  constructor(data: BlockData) {
    this.data = data;
    this.element = this.render();
    this.attachEvents();
  }

  /**
   * Render the block element
   */
  protected render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'block-wrapper';
    wrapper.dataset.blockId = this.data.id;
    wrapper.dataset.blockType = this.data.type;

    wrapper.innerHTML = `
      <div class="block-container" data-selected="false">
        <!-- Tag label (shown on hover) -->
        <div class="block-tag-label">${this.getTagLabel()}</div>

        <!-- Content -->
        <div class="block-content ${this.data.styles.join(' ')}">
          ${this.renderContent()}
        </div>

        <!-- Actions panel -->
        <div class="block-actions">
          <button class="block-drag-handle" title="Drag to move" type="button">⋮⋮</button>
          <button class="block-add" title="Add block below" type="button">+</button>
          <button class="block-delete" title="Delete block" type="button">×</button>
        </div>
      </div>
    `;

    this.contentElement = wrapper.querySelector('.block-content');
    return wrapper;
  }

  /**
   * Render the actual content of the block
   */
  protected abstract renderContent(): string;

  /**
   * Get the tag label for this block
   */
  protected abstract getTagLabel(): string;

  /**
   * Attach event listeners
   */
  protected attachEvents(): void {
    const container = this.element.querySelector('.block-container');
    if (!container) return;

    // Click to select
    container.addEventListener('click', (e) => {
      // Don't select if clicking on content in edit mode
      const target = e.target as HTMLElement;
      if (target.getAttribute('contenteditable') === 'true') return;

      e.stopPropagation();
      this.select();
    });

    // Delete button
    const deleteBtn = this.element.querySelector('.block-delete');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.delete();
    });

    // Add button
    const addBtn = this.element.querySelector('.block-add');
    addBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerAddBlock();
    });

    // Content editing
    if (this.contentElement) {
      this.setupContentEditing();
    }
  }

  /**
   * Setup content editing
   */
  protected setupContentEditing(): void {
    if (!this.contentElement) return;

    const editableElement = this.contentElement.querySelector('[data-editable]');
    if (!editableElement) return;

    editableElement.addEventListener('input', () => {
      this.updateContent();
      this.triggerChange();
    });

    editableElement.addEventListener('blur', () => {
      this.updateContent();
    });
  }

  /**
   * Update content from editable element
   */
  protected updateContent(): void {
    if (!this.contentElement) return;

    const editableElement = this.contentElement.querySelector('[data-editable]');
    if (editableElement) {
      this.data.content = editableElement.textContent || '';
    }
  }

  /**
   * Select this block
   */
  select(): void {
    // Deselect all other blocks
    document.querySelectorAll('.block-container').forEach(el => {
      el.setAttribute('data-selected', 'false');
    });

    // Select this block
    const container = this.element.querySelector('.block-container');
    if (container) {
      container.setAttribute('data-selected', 'true');
    }

    // Notify parent
    if (this.onSelectCallback) {
      this.onSelectCallback(this);
    }
  }

  /**
   * Deselect this block
   */
  deselect(): void {
    const container = this.element.querySelector('.block-container');
    if (container) {
      container.setAttribute('data-selected', 'false');
    }
  }

  /**
   * Delete this block
   */
  delete(): void {
    // Dispatch delete event for editor to handle
    const event = new CustomEvent('deleteBlock', {
      detail: { block: this },
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Add a CSS class to the block
   */
  addClass(className: string): void {
    if (!this.data.styles.includes(className)) {
      this.data.styles.push(className);
      const editableElement = this.contentElement?.querySelector('[data-editable]') ||
                             this.contentElement?.querySelector('[data-list]');
      if (editableElement) {
        editableElement.classList.add(className);
      } else if (this.contentElement) {
        // For blocks without editable elements (like images), add class to content element
        this.contentElement.classList.add(className);
      }
      this.triggerChange();
    }
  }

  /**
   * Remove a CSS class from the block
   */
  removeClass(className: string): void {
    const index = this.data.styles.indexOf(className);
    if (index > -1) {
      this.data.styles.splice(index, 1);
      const editableElement = this.contentElement?.querySelector('[data-editable]') ||
                             this.contentElement?.querySelector('[data-list]');
      if (editableElement) {
        editableElement.classList.remove(className);
      } else if (this.contentElement) {
        // For blocks without editable elements (like images), remove class from content element
        this.contentElement.classList.remove(className);
      }
      this.triggerChange();
    }
  }

  /**
   * Remove all classes with a specific prefix
   */
  removeClassesByPrefix(prefix: string): void {
    this.data.styles = this.data.styles.filter(cls => !cls.startsWith(prefix));
    const editableElement = this.contentElement?.querySelector('[data-editable]') ||
                           this.contentElement?.querySelector('[data-list]');
    if (editableElement) {
      Array.from(editableElement.classList).forEach(cls => {
        if (cls.startsWith(prefix)) {
          editableElement.classList.remove(cls);
        }
      });
    } else if (this.contentElement) {
      // For blocks without editable elements (like images), remove classes from content element
      Array.from(this.contentElement.classList).forEach(cls => {
        if (cls.startsWith(prefix)) {
          this.contentElement!.classList.remove(cls);
        }
      });
    }
    this.triggerChange();
  }

  /**
   * Set an inline style property
   */
  setInlineStyle(property: keyof import('./types').InlineStyles, value: string): void {
    if (!this.data.inlineStyles) {
      this.data.inlineStyles = {};
    }
    (this.data.inlineStyles as any)[property] = value;
    this.applyInlineStyles();
    this.triggerChange();
  }

  /**
   * Remove an inline style property
   */
  removeInlineStyle(property: keyof import('./types').InlineStyles): void {
    if (this.data.inlineStyles) {
      delete (this.data.inlineStyles as any)[property];
      this.applyInlineStyles();
      this.triggerChange();
    }
  }

  /**
   * Apply inline styles to the content element
   */
  protected applyInlineStyles(): void {
    const editableElement = this.contentElement?.querySelector('[data-editable]') ||
                           this.contentElement?.querySelector('[data-list]');
    const targetElement = editableElement || this.contentElement;

    if (targetElement && this.data.inlineStyles) {
      const htmlElement = targetElement as HTMLElement;

      // Apply each style
      if (this.data.inlineStyles.textAlign) {
        htmlElement.style.textAlign = this.data.inlineStyles.textAlign;
      } else {
        htmlElement.style.textAlign = '';
      }

      if (this.data.inlineStyles.fontSize) {
        htmlElement.style.fontSize = this.data.inlineStyles.fontSize;
      } else {
        htmlElement.style.fontSize = '';
      }

      if (this.data.inlineStyles.color) {
        htmlElement.style.color = this.data.inlineStyles.color;
      } else {
        htmlElement.style.color = '';
      }

      if (this.data.inlineStyles.fontWeight) {
        htmlElement.style.fontWeight = this.data.inlineStyles.fontWeight;
      } else {
        htmlElement.style.fontWeight = '';
      }

      if (this.data.inlineStyles.fontStyle) {
        htmlElement.style.fontStyle = this.data.inlineStyles.fontStyle;
      } else {
        htmlElement.style.fontStyle = '';
      }

      if (this.data.inlineStyles.textDecoration) {
        htmlElement.style.textDecoration = this.data.inlineStyles.textDecoration;
      } else {
        htmlElement.style.textDecoration = '';
      }
    }
  }

  /**
   * Convert inline styles object to CSS string
   */
  protected stylesToString(): string {
    if (!this.data.inlineStyles) return '';

    const styles: string[] = [];

    if (this.data.inlineStyles.textAlign) {
      styles.push(`text-align: ${this.data.inlineStyles.textAlign}`);
    }
    if (this.data.inlineStyles.fontSize) {
      styles.push(`font-size: ${this.data.inlineStyles.fontSize}`);
    }
    if (this.data.inlineStyles.color) {
      styles.push(`color: ${this.data.inlineStyles.color}`);
    }
    if (this.data.inlineStyles.fontWeight) {
      styles.push(`font-weight: ${this.data.inlineStyles.fontWeight}`);
    }
    if (this.data.inlineStyles.fontStyle) {
      styles.push(`font-style: ${this.data.inlineStyles.fontStyle}`);
    }
    if (this.data.inlineStyles.textDecoration) {
      styles.push(`text-decoration: ${this.data.inlineStyles.textDecoration}`);
    }

    return styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
  }

  /**
   * Set callback for when block is selected
   */
  onSelect(callback: (block: BaseBlock) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Set callback for when block changes
   */
  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * Trigger change event
   */
  triggerChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  /**
   * Trigger add block event
   */
  protected triggerAddBlock(): void {
    const event = new CustomEvent('addBlock', {
      detail: { afterBlock: this },
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Get the block element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Get block data
   */
  getData(): BlockData {
    return this.data;
  }

  /**
   * Export block to HTML
   */
  abstract toHTML(): string;

  /**
   * Focus the block for editing
   */
  focus(): void {
    const editable = this.contentElement?.querySelector('[data-editable]') as HTMLElement;
    if (editable) {
      editable.focus();

      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel && editable.childNodes.length > 0) {
        range.setStart(editable.childNodes[0], editable.textContent?.length || 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }
}