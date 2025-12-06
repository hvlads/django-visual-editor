import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * List block (UL/OL)
 */
export class ListBlock extends BaseBlock {
  protected renderContent(): string {
    const ordered = this.data.metadata?.ordered || false;
    const tag = ordered ? 'ol' : 'ul';
    const items = Array.isArray(this.data.content) ? this.data.content : [this.data.content];
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';

    const itemsHTML = items.map((item, index) =>
      `<li contenteditable="true" data-editable data-index="${index}">${item || 'List item'}</li>`
    ).join('');

    return `
      <${tag} data-list${classes}>
        ${itemsHTML}
      </${tag}>
      <button type="button" class="add-list-item" title="Add item">+ Add item</button>
    `;
  }

  protected getTagLabel(): string {
    const ordered = this.data.metadata?.ordered || false;
    return ordered ? 'OL' : 'UL';
  }

  protected setupContentEditing(): void {
    if (!this.contentElement) return;

    // Handle list item editing
    const listItems = this.contentElement.querySelectorAll('li[data-editable]');
    listItems.forEach(item => {
      item.addEventListener('input', () => {
        this.updateListContent();
        this.triggerChange();
      });

      // Enter creates new item
      item.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          this.addListItem(parseInt((item as HTMLElement).dataset.index || '0') + 1);
        }
      });
    });

    // Add item button
    const addBtn = this.contentElement.querySelector('.add-list-item');
    addBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addListItem();
    });

    // Apply inline styles after rendering
    this.applyInlineStyles();
  }

  private updateListContent(): void {
    if (!this.contentElement) return;

    const items: string[] = [];
    const listItems = this.contentElement.querySelectorAll('li[data-editable]');

    listItems.forEach(item => {
      items.push(item.innerHTML || '');
    });

    this.data.content = items;
  }

  private addListItem(index?: number): void {
    const items = Array.isArray(this.data.content) ? [...this.data.content] : [this.data.content];

    if (index !== undefined) {
      items.splice(index, 0, '');
    } else {
      items.push('');
    }

    this.data.content = items;

    // Re-render
    if (this.contentElement) {
      this.contentElement.innerHTML = this.renderContent();
      this.setupContentEditing();
    }

    this.triggerChange();
  }

  toHTML(): string {
    const ordered = this.data.metadata?.ordered || false;
    const tag = ordered ? 'ol' : 'ul';
    const items = Array.isArray(this.data.content) ? this.data.content : [this.data.content];
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    const styles = this.stylesToString();

    const itemsHTML = items.map(item => `  <li>${item}</li>`).join('\n');

    return `<${tag}${classes}${styles}>\n${itemsHTML}\n</${tag}>`;
  }
}