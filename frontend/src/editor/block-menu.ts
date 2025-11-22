import { BlockType } from '../blocks/types';

/**
 * Block type selection menu
 */
export class BlockMenu {
  private element: HTMLElement;
  private onSelectCallback?: (type: BlockType) => void;

  constructor() {
    this.element = this.createMenu();
    document.body.appendChild(this.element);
    this.attachEvents();
  }

  /**
   * Create menu element
   */
  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'block-menu';
    menu.style.display = 'none';

    menu.innerHTML = `
      <div class="block-menu-header">
        <span>Add Block</span>
        <button type="button" class="menu-close">×</button>
      </div>
      <div class="block-menu-items">
        <button type="button" class="block-menu-item" data-type="heading">
          <span class="item-icon">📝</span>
          <div class="item-info">
            <div class="item-name">Heading</div>
            <div class="item-desc">Large section heading</div>
          </div>
        </button>
        <button type="button" class="block-menu-item" data-type="paragraph">
          <span class="item-icon">📄</span>
          <div class="item-info">
            <div class="item-name">Paragraph</div>
            <div class="item-desc">Plain text block</div>
          </div>
        </button>
        <button type="button" class="block-menu-item" data-type="list">
          <span class="item-icon">📋</span>
          <div class="item-info">
            <div class="item-name">List</div>
            <div class="item-desc">Bulleted or numbered list</div>
          </div>
        </button>
        <button type="button" class="block-menu-item" data-type="code">
          <span class="item-icon">💻</span>
          <div class="item-info">
            <div class="item-name">Code</div>
            <div class="item-desc">Code snippet with syntax highlighting</div>
          </div>
        </button>
        <button type="button" class="block-menu-item" data-type="quote">
          <span class="item-icon">💬</span>
          <div class="item-info">
            <div class="item-name">Quote</div>
            <div class="item-desc">Highlighted quotation</div>
          </div>
        </button>
        <button type="button" class="block-menu-item" data-type="image">
          <span class="item-icon">🖼️</span>
          <div class="item-info">
            <div class="item-name">Image</div>
            <div class="item-desc">Upload or embed an image</div>
          </div>
        </button>
      </div>
    `;

    return menu;
  }

  /**
   * Attach events
   */
  private attachEvents(): void {
    // Close button
    const closeBtn = this.element.querySelector('.menu-close');
    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Block type items
    const items = this.element.querySelectorAll('.block-menu-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type as BlockType;
        if (type && this.onSelectCallback) {
          this.onSelectCallback(type);
          this.hide();
        }
      });
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node) && this.element.style.display !== 'none') {
        const addBlockBtn = document.querySelector('.add-block-btn');
        if (!addBlockBtn?.contains(e.target as Node)) {
          this.hide();
        }
      }
    });
  }

  /**
   * Show menu at position
   */
  show(x: number, y: number): void {
    this.element.style.display = 'block';
    this.element.style.position = 'fixed';
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.zIndex = '2000';
  }

  /**
   * Hide menu
   */
  hide(): void {
    this.element.style.display = 'none';
  }

  /**
   * Set callback for when block type is selected
   */
  onSelect(callback: (type: BlockType) => void): void {
    this.onSelectCallback = callback;
  }
}
