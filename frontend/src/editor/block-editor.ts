import { BaseBlock } from '../blocks/base-block';
import { BlockFactory } from '../blocks/block-factory';
import { BlockData, BlockType } from '../blocks/types';
import { EditorConfig } from '../types';
import { ContextualToolbar } from './contextual-toolbar';
import { BlockMenu } from './block-menu';

/**
 * Main Block Editor
 */
export class BlockEditor {
  private blocks: BaseBlock[] = [];
  private editorElement: HTMLElement;
  private textareaElement: HTMLTextAreaElement;
  private config: EditorConfig;
  private selectedBlock: BaseBlock | null = null;
  private contextualToolbar: ContextualToolbar;
  private blockMenu: BlockMenu;
  private addBlockButton: HTMLElement;
  private pendingUploads: number = 0;

  constructor(
    editorId: string,
    textareaId: string,
    config: EditorConfig
  ) {
    const editor = document.getElementById(editorId);
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;

    if (!editor || !textarea) {
      throw new Error('Editor or textarea element not found');
    }

    this.editorElement = editor;
    this.textareaElement = textarea;
    this.config = config;

    // Initialize contextual toolbar
    this.contextualToolbar = new ContextualToolbar();

    // Initialize block menu
    this.blockMenu = new BlockMenu();
    this.blockMenu.onSelect((type) => {
      this.addBlock(type);
    });

    // Create add block button
    this.addBlockButton = this.createAddBlockButton();

    this.init();
  }

  /**
   * Initialize the editor
   */
  private init(): void {
    // Set up editor element
    this.editorElement.className = 'block-editor';
    this.editorElement.innerHTML = '';

    // Add the "Add Block" button at the top
    const container = this.editorElement.parentElement;
    if (container) {
      container.insertBefore(this.addBlockButton, this.editorElement);
    }

    // Load initial content or create empty paragraph
    if (this.textareaElement.value) {
      this.loadFromHTML(this.textareaElement.value);
    } else {
      this.addBlock('paragraph');
    }

    // Set up event listeners
    this.setupEventListeners();

    // Set placeholder
    if (this.config.placeholder && this.blocks.length === 0) {
      this.addBlock('paragraph');
    }
  }

  /**
   * Create the "Add Block" button
   */
  private createAddBlockButton(): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-block-btn';
    button.innerHTML = '➕ Add Block';

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = button.getBoundingClientRect();
      this.blockMenu.show(rect.left, rect.bottom + 5);
    });

    return button;
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Add block event
    this.editorElement.addEventListener('addBlock', ((e: CustomEvent) => {
      const afterBlock = e.detail.afterBlock as BaseBlock;
      const index = this.blocks.indexOf(afterBlock);
      if (index > -1) {
        this.addBlock('paragraph', index + 1);
      }
    }) as EventListener);

    // Delete block event
    this.editorElement.addEventListener('deleteBlock', ((e: CustomEvent) => {
      const block = e.detail.block as BaseBlock;
      this.removeBlock(block);
    }) as EventListener);

    // Image upload events
    this.editorElement.addEventListener('uploadStart', (() => {
      this.trackUploadStart();
    }) as EventListener);

    this.editorElement.addEventListener('uploadComplete', (() => {
      this.trackUploadComplete();
    }) as EventListener);

    // Click outside to deselect
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      const clickedToolbar = document.querySelector('.contextual-toolbar')?.contains(target);
      const clickedBlockMenu = document.querySelector('.block-menu')?.contains(target);

      if (!this.editorElement.contains(target) && !clickedToolbar && !clickedBlockMenu) {
        this.deselectAll();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to deselect and close menus
      if (e.key === 'Escape') {
        this.deselectAll();
        this.blockMenu.hide();
      }

      // Cmd/Ctrl + / to show block menu
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        this.showBlockMenu();
      }
    });
  }

  /**
   * Add a new block
   */
  addBlock(type: BlockType, index?: number, content: string | string[] = ''): BaseBlock {
    const data = BlockFactory.createBlockData(type, content);
    const block = BlockFactory.createBlock(data);

    // Set up block callbacks
    block.onSelect((selectedBlock) => {
      this.selectedBlock = selectedBlock;
      this.contextualToolbar.show(selectedBlock);
      this.notifyBlockSelected(selectedBlock);
    });

    block.onChange(() => {
      this.updateTextarea();
    });

    // Add to blocks array
    if (index !== undefined && index >= 0 && index <= this.blocks.length) {
      this.blocks.splice(index, 0, block);
    } else {
      this.blocks.push(block);
    }

    // Add to DOM
    const blockElement = block.getElement();
    if (index !== undefined && index < this.editorElement.children.length) {
      this.editorElement.insertBefore(blockElement, this.editorElement.children[index]);
    } else {
      this.editorElement.appendChild(blockElement);
    }

    // Focus new block
    block.focus();

    // Update textarea
    this.updateTextarea();

    return block;
  }

  /**
   * Remove a block
   */
  removeBlock(block: BaseBlock): void {
    const index = this.blocks.indexOf(block);
    if (index > -1) {
      this.blocks.splice(index, 1);
      block.getElement().remove();
      this.updateTextarea();

      // Focus previous or next block
      if (this.blocks.length > 0) {
        const focusIndex = index > 0 ? index - 1 : 0;
        this.blocks[focusIndex]?.focus();
      } else {
        // No blocks left, add a new paragraph
        this.addBlock('paragraph');
      }
    }
  }

  /**
   * Deselect all blocks
   */
  private deselectAll(): void {
    this.blocks.forEach(block => block.deselect());
    this.selectedBlock = null;
    this.contextualToolbar.hide();
  }

  /**
   * Show block type menu
   */
  private showBlockMenu(): void {
    // TODO: Implement block type selection menu
    console.log('Block menu - to be implemented');
  }

  /**
   * Notify that a block was selected
   */
  private notifyBlockSelected(block: BaseBlock): void {
    const event = new CustomEvent('blockSelected', {
      detail: { block }
    });
    this.editorElement.dispatchEvent(event);
  }

  /**
   * Update the hidden textarea with HTML output
   */
  private updateTextarea(): void {
    const html = this.toHTML();
    this.textareaElement.value = html;
  }

  /**
   * Export all blocks to HTML
   */
  toHTML(): string {
    return this.blocks.map(block => block.toHTML()).join('\n');
  }

  /**
   * Load content from HTML
   */
  private loadFromHTML(html: string): void {
    // Simple HTML parsing - convert to blocks
    // This is a basic implementation, can be improved
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const elements = Array.from(tempDiv.children);

    if (elements.length === 0) {
      this.addBlock('paragraph');
      return;
    }

    elements.forEach(el => {
      const blockData = this.htmlElementToBlockData(el);
      if (blockData) {
        const block = BlockFactory.createBlock(blockData);
        block.onChange(() => this.updateTextarea());
        block.onSelect((selectedBlock) => {
          this.selectedBlock = selectedBlock;
          this.contextualToolbar.show(selectedBlock);
          this.notifyBlockSelected(selectedBlock);
        });
        this.blocks.push(block);
        this.editorElement.appendChild(block.getElement());
      }
    });
  }

  /**
   * Parse inline styles from HTML element
   */
  private parseInlineStyles(el: HTMLElement): import('../blocks/types').InlineStyles | undefined {
    const style = el.getAttribute('style');
    if (!style) return undefined;

    const inlineStyles: import('../blocks/types').InlineStyles = {};

    // Parse text-align
    const textAlign = el.style.textAlign;
    if (textAlign && ['left', 'center', 'right', 'justify'].includes(textAlign)) {
      inlineStyles.textAlign = textAlign as 'left' | 'center' | 'right' | 'justify';
    }

    // Parse font-size
    if (el.style.fontSize) {
      inlineStyles.fontSize = el.style.fontSize;
    }

    // Parse color
    if (el.style.color) {
      inlineStyles.color = el.style.color;
    }

    // Parse font-weight
    if (el.style.fontWeight) {
      inlineStyles.fontWeight = el.style.fontWeight as 'normal' | 'bold' | '600' | '700';
    }

    // Parse font-style
    if (el.style.fontStyle) {
      inlineStyles.fontStyle = el.style.fontStyle as 'normal' | 'italic';
    }

    // Parse text-decoration
    if (el.style.textDecoration) {
      inlineStyles.textDecoration = el.style.textDecoration as 'none' | 'underline';
    }

    return Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined;
  }

  /**
   * Convert HTML element to block data
   */
  private htmlElementToBlockData(el: Element): BlockData | null {
    const tagName = el.tagName.toLowerCase();
    const content = el.textContent || '';
    const classes = Array.from(el.classList);
    const inlineStyles = this.parseInlineStyles(el as HTMLElement);

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return {
          id: BlockFactory.generateId(),
          type: 'heading',
          content,
          styles: classes,
          inlineStyles,
          metadata: { level: parseInt(tagName[1]) }
        };

      case 'p':
        return {
          id: BlockFactory.generateId(),
          type: 'paragraph',
          content,
          styles: classes,
          inlineStyles
        };

      case 'ul':
      case 'ol':
        const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent || '');
        return {
          id: BlockFactory.generateId(),
          type: 'list',
          content: items,
          styles: classes,
          inlineStyles,
          metadata: { ordered: tagName === 'ol' }
        };

      case 'pre':
        const codeEl = el.querySelector('code');
        return {
          id: BlockFactory.generateId(),
          type: 'code',
          content: codeEl?.textContent || content,
          styles: classes,
          inlineStyles
        };

      case 'blockquote':
        return {
          id: BlockFactory.generateId(),
          type: 'quote',
          content,
          styles: classes,
          inlineStyles
        };

      case 'img':
        const imgEl = el as HTMLImageElement;
        const width = imgEl.getAttribute('width') ? parseInt(imgEl.getAttribute('width')!) : 0;
        return {
          id: BlockFactory.generateId(),
          type: 'image',
          content: imgEl.src || '',
          styles: classes,
          inlineStyles,
          metadata: { width }
        };

      case 'div':
        // Check if div contains an image (wrapped image with alignment)
        const divImgEl = el.querySelector('img');
        if (divImgEl) {
          const imgWidth = divImgEl.getAttribute('width') ? parseInt(divImgEl.getAttribute('width')!) : 0;
          return {
            id: BlockFactory.generateId(),
            type: 'image',
            content: divImgEl.getAttribute('src') || '',
            styles: Array.from(divImgEl.classList),
            inlineStyles,
            metadata: { width: imgWidth }
          };
        }
        // Otherwise treat as paragraph
        return {
          id: BlockFactory.generateId(),
          type: 'paragraph',
          content,
          styles: classes,
          inlineStyles
        };

      default:
        // Unknown tag, treat as paragraph
        return {
          id: BlockFactory.generateId(),
          type: 'paragraph',
          content,
          styles: classes,
          inlineStyles
        };
    }
  }

  /**
   * Get the selected block
   */
  getSelectedBlock(): BaseBlock | null {
    return this.selectedBlock;
  }

  /**
   * Get all blocks
   */
  getBlocks(): BaseBlock[] {
    return this.blocks;
  }

  /**
   * Track upload start
   */
  trackUploadStart(): void {
    this.pendingUploads++;
    this.updateFormWarning();
  }

  /**
   * Track upload complete
   */
  trackUploadComplete(): void {
    this.pendingUploads--;
    if (this.pendingUploads < 0) this.pendingUploads = 0;
    this.updateFormWarning();
  }

  /**
   * Update form warning based on pending uploads
   */
  private updateFormWarning(): void {
    const form = this.textareaElement.closest('form');
    if (!form) return;

    let warningEl = form.querySelector('.upload-warning') as HTMLElement;

    if (this.pendingUploads > 0) {
      if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.className = 'upload-warning';
        warningEl.style.cssText = `
          background: #fff3cd;
          border: 2px solid #ffc107;
          color: #856404;
          padding: 12px;
          margin: 10px 0;
          border-radius: 4px;
          font-weight: bold;
        `;

        // Insert at top of form
        form.insertBefore(warningEl, form.firstChild);
      }

      warningEl.textContent = `⏳ Uploading ${this.pendingUploads} image(s)... Please wait before saving!`;
      warningEl.style.display = 'block';

      // Disable submit buttons
      const submitButtons = form.querySelectorAll('input[type="submit"], button[type="submit"]');
      submitButtons.forEach(btn => {
        (btn as HTMLButtonElement | HTMLInputElement).disabled = true;
      });
    } else {
      if (warningEl) {
        warningEl.style.display = 'none';
      }

      // Enable submit buttons
      const submitButtons = form.querySelectorAll('input[type="submit"], button[type="submit"]');
      submitButtons.forEach(btn => {
        (btn as HTMLButtonElement | HTMLInputElement).disabled = false;
      });
    }
  }
}