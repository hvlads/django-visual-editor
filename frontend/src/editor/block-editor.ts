import { BaseBlock } from '../blocks/base-block';
import { BlockFactory } from '../blocks/block-factory';
import { BlockData, BlockType } from '../blocks/types';
import { EditorConfig } from '../types';
import { ContextualToolbar } from './contextual-toolbar';
import { TextToolbar } from './text-toolbar';
import { BlockMenu } from './block-menu';
import { PasteModal } from './paste-modal';
import { HTMLEditor } from './html-editor';
import { AIAssistantPanel, AIConfig } from './ai-assistant-panel';

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
  private textToolbar: TextToolbar;
  private blockMenu: BlockMenu;
  private addBlockButton: HTMLElement;
  private pendingUploads: number = 0;
  private pasteModal: PasteModal | null = null;
  private htmlEditor: HTMLEditor | null = null;
  private htmlEditorContainer: HTMLElement | null = null;
  private modeSwitchButton: HTMLElement;
  private isHTMLMode: boolean = false;
  private aiPanel: AIAssistantPanel | null = null;

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

    // Initialize contextual toolbar (for blocks)
    this.contextualToolbar = new ContextualToolbar();

    // Initialize text toolbar (for selected text)
    this.textToolbar = new TextToolbar();

    // Initialize block menu
    this.blockMenu = new BlockMenu();
    this.blockMenu.onSelect((type) => {
      this.addBlock(type);
    });
    this.blockMenu.onPaste(() => {
      this.showPasteModal();
    });

    // Create add block button
    this.addBlockButton = this.createAddBlockButton();

    // Create mode switch button
    this.modeSwitchButton = this.createModeSwitchButton();

    this.init();
  }

  /**
   * Initialize the editor
   */
  private init(): void {
    // Set up editor element
    this.editorElement.className = 'block-editor';
    this.editorElement.innerHTML = '';

    // Add the "Add Block" button and mode switch button at the top
    const container = this.editorElement.parentElement;
    if (container) {
      // Create toolbar for buttons
      const toolbar = document.createElement('div');
      toolbar.className = 'editor-toolbar';
      toolbar.appendChild(this.addBlockButton);
      toolbar.appendChild(this.modeSwitchButton);
      container.insertBefore(toolbar, this.editorElement);

      // Create HTML editor container
      this.htmlEditorContainer = document.createElement('div');
      this.htmlEditorContainer.className = 'html-editor-container';
      this.htmlEditorContainer.style.display = 'none';
      container.insertBefore(this.htmlEditorContainer, this.editorElement.nextSibling);

      // Initialize AI panel if enabled
      if (this.config.ai?.enabled) {
        // Create layout wrapper for editor + AI sidebar
        const wrapper = document.createElement('div');
        wrapper.className = 'editor-with-ai-layout';

        const mainArea = document.createElement('div');
        mainArea.className = 'editor-main-area';

        const aiSidebar = document.createElement('div');
        aiSidebar.className = 'editor-ai-sidebar';

        // Move existing editor into main area
        const editorParent = this.editorElement.parentElement!;
        editorParent.insertBefore(wrapper, this.editorElement);
        wrapper.appendChild(mainArea);
        wrapper.appendChild(aiSidebar);
        mainArea.appendChild(this.editorElement);

        // Also move HTML editor container into main area
        if (this.htmlEditorContainer) {
          mainArea.appendChild(this.htmlEditorContainer);
        }

        // Create AI panel
        this.aiPanel = new AIAssistantPanel(this, this.config.ai);
        aiSidebar.appendChild(this.aiPanel.getElement());
      }
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
    button.innerHTML = '<span class="btn-icon">+</span> Add Block';

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = button.getBoundingClientRect();
      this.blockMenu.show(rect.left, rect.bottom + 5);
    });

    return button;
  }

  /**
   * Create the mode switch button
   */
  private createModeSwitchButton(): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-switch-btn';
    button.innerHTML = '&lt;/&gt; HTML Mode';

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHTMLMode();
    });

    return button;
  }

  /**
   * Show paste modal
   */
  private showPasteModal(): void {
    if (!this.pasteModal) {
      this.pasteModal = new PasteModal((content) => {
        this.insertContent(content);
      });
    }
    this.pasteModal.open();
  }

  /**
   * Insert content from paste modal with auto-detection
   */
  private insertContent(content: string): void {
    // Auto-detect if content is HTML or plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content.trim();
    const elements = Array.from(tempDiv.children);

    if (elements.length > 0) {
      // Has HTML elements - insert as HTML
      this.insertHTMLBlocks(content);
    } else {
      // Plain text - insert as text blocks
      this.insertTextBlocks(content);
    }
  }

  /**
   * Insert HTML as blocks
   */
  private insertHTMLBlocks(html: string): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const elements = Array.from(tempDiv.children);

    if (elements.length === 0) return;

    // Find index to insert after selected block
    let insertIndex = this.blocks.length;
    if (this.selectedBlock) {
      insertIndex = this.blocks.indexOf(this.selectedBlock) + 1;
    }

    let currentInsertIndex = insertIndex;

    elements.forEach((el) => {
      // Use htmlElementToBlockData which now preserves innerHTML including links
      const blockData = this.htmlElementToBlockData(el);
      if (blockData) {
        const block = BlockFactory.createBlock(blockData);
        block.onChange(() => this.updateTextarea());
        block.onSelect((selectedBlock) => {
          this.selectedBlock = selectedBlock;
          this.contextualToolbar.show(selectedBlock);
          this.notifyBlockSelected(selectedBlock);
        });

        this.blocks.splice(currentInsertIndex, 0, block);

        if (currentInsertIndex < this.editorElement.children.length) {
          this.editorElement.insertBefore(block.getElement(), this.editorElement.children[currentInsertIndex]);
        } else {
          this.editorElement.appendChild(block.getElement());
        }

        currentInsertIndex++;
      }
    });

    this.updateTextarea();
  }

  /**
   * Insert plain text as separate paragraph blocks
   */
  private insertTextBlocks(text: string): void {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) return;

    // Find index to insert after selected block
    let insertIndex = this.blocks.length;
    if (this.selectedBlock) {
      insertIndex = this.blocks.indexOf(this.selectedBlock) + 1;
    }

    lines.forEach((line, i) => {
      this.addBlock('paragraph', insertIndex + i, line.trim());
    });

    // Update textarea to save the changes
    this.updateTextarea();
  }

  /**
   * Toggle between Visual and HTML mode
   */
  private toggleHTMLMode(): void {
    if (this.isHTMLMode) {
      this.switchToVisualMode();
    } else {
      this.switchToHTMLMode();
    }
  }

  /**
   * Switch to HTML editing mode
   */
  private async switchToHTMLMode(): Promise<void> {
    if (!this.htmlEditorContainer) return;

    // Get current HTML from blocks
    const html = this.toHTML();

    // Hide visual editor
    this.editorElement.style.display = 'none';
    this.contextualToolbar.hide();

    // Create and show HTML editor
    if (!this.htmlEditor) {
      this.htmlEditor = new HTMLEditor(
        this.htmlEditorContainer,
        html,
        (updatedHTML) => {
          this.updateTextarea();
        }
      );
    } else {
      await this.htmlEditor.setValue(html);
    }

    this.htmlEditorContainer.style.display = 'block';
    this.htmlEditor.show();

    // Update button
    this.modeSwitchButton.innerHTML = '👁️ Visual Mode';
    this.modeSwitchButton.classList.add('active');

    this.isHTMLMode = true;
  }

  /**
   * Switch to Visual editing mode
   */
  private switchToVisualMode(): void {
    if (!this.htmlEditor || !this.htmlEditorContainer) return;

    // Get HTML from HTML editor
    const html = this.htmlEditor.getValue();

    // Hide HTML editor
    this.htmlEditorContainer.style.display = 'none';
    this.htmlEditor.hide();

    // Clear and reload visual editor
    this.editorElement.innerHTML = '';
    this.blocks = [];
    this.loadFromHTML(html);

    // Show visual editor
    this.editorElement.style.display = 'block';

    // Update button
    this.modeSwitchButton.innerHTML = '&lt;/&gt; HTML Mode';
    this.modeSwitchButton.classList.remove('active');

    this.isHTMLMode = false;
    this.updateTextarea();
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

    // Add to AI context event
    this.editorElement.addEventListener('addToAIContext', ((e: CustomEvent) => {
      const block = e.detail.block as BaseBlock;
      if (this.aiPanel) {
        this.aiPanel.addBlockToContext(block);
      }
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
      const clickedTextToolbar = document.querySelector('.text-toolbar')?.contains(target);
      const clickedBlockMenu = document.querySelector('.block-menu')?.contains(target);

      if (!this.editorElement.contains(target) && !clickedToolbar && !clickedTextToolbar && !clickedBlockMenu) {
        this.deselectAll();
        this.textToolbar.hide();
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

    // Text selection - show text toolbar when text is selected
    document.addEventListener('mouseup', (e) => {
      setTimeout(() => {
        // Check if clicked on text toolbar - don't hide it
        const target = e.target as Node;
        const clickedTextToolbar = document.querySelector('.text-toolbar')?.contains(target);

        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          // Find which block contains the selection
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const blockElement = (container.nodeType === 3 ? container.parentElement : container as HTMLElement)?.closest('.block-wrapper');

          if (blockElement && this.editorElement.contains(blockElement)) {
            // Find the block object
            const blockId = blockElement.getAttribute('data-block-id');
            const block = this.blocks.find(b => b.getData().id === blockId);

            if (block) {
              this.selectedBlock = block;
              // Show TEXT toolbar for selected text, hide block toolbar
              this.contextualToolbar.hide();
              this.textToolbar.show(block, selection);
            }
          }
        } else if (!clickedTextToolbar) {
          // No text selected and didn't click toolbar - hide text toolbar
          this.textToolbar.hide();
        }
      }, 10);
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
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();

    const elements = Array.from(tempDiv.children);

    // Check if there's only text content (no HTML elements)
    if (elements.length === 0) {
      const textContent = tempDiv.textContent?.trim() || '';

      if (textContent) {
        // It's plain text - split by lines and create paragraph blocks
        const lines = textContent.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          lines.forEach(line => {
            const blockData = BlockFactory.createBlockData('paragraph', line.trim());
            const block = BlockFactory.createBlock(blockData);
            block.onChange(() => this.updateTextarea());
            block.onSelect((selectedBlock) => {
              this.selectedBlock = selectedBlock;
              this.contextualToolbar.show(selectedBlock);
              this.notifyBlockSelected(selectedBlock);
            });
            this.blocks.push(block);
            this.editorElement.appendChild(block.getElement());
          });
          return;
        }
      }

      // No content at all - create empty paragraph
      this.addBlock('paragraph');
      return;
    }

    // Has HTML elements - parse them
    elements.forEach(el => {
      // Use htmlElementToBlockData which now preserves innerHTML including links
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
   * Parse inline elements (img, a, b, i, u, etc.) and split into separate blocks
   */
  private parseInlineElements(el: Element): BlockData[] {
    const blocks: BlockData[] = []

    const processNode = (node: Node, currentText: string = ''): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return currentText + (node.textContent || '')
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const tagName = element.tagName.toLowerCase()

        // Create paragraph block from accumulated text
        if (currentText.trim()) {
          blocks.push({
            id: BlockFactory.generateId(),
            type: 'paragraph',
            content: currentText.trim(),
            styles: [],
          })
          currentText = ''
        }

        // Handle inline elements
        switch (tagName) {
          case 'img':
            const imgEl = element as HTMLImageElement
            const width = imgEl.getAttribute('width') ? parseInt(imgEl.getAttribute('width')!) : 0
            blocks.push({
              id: BlockFactory.generateId(),
              type: 'image',
              content: imgEl.src || imgEl.getAttribute('src') || '',
              styles: Array.from(imgEl.classList),
              metadata: { width }
            })
            return ''

          case 'a':
            const linkText = element.textContent || ''
            blocks.push({
              id: BlockFactory.generateId(),
              type: 'paragraph',
              content: linkText,
              styles: ['link'],
            })
            return ''

          case 'b':
          case 'strong':
          case 'i':
          case 'em':
          case 'u':
            // Извлекаем только текст без стилей (по требованию пользователя)
            const formattedText = element.textContent || ''
            if (formattedText.trim()) {
              blocks.push({
                id: BlockFactory.generateId(),
                type: 'paragraph',
                content: formattedText.trim(),
                styles: [],
              })
            }
            return ''

          case 'br':
            if (currentText.trim()) {
              blocks.push({
                id: BlockFactory.generateId(),
                type: 'paragraph',
                content: currentText.trim(),
                styles: [],
              })
              return ''
            }
            return currentText

          default:
            // Recursively process children
            let accumulated = currentText
            element.childNodes.forEach(child => {
              accumulated = processNode(child, accumulated)
            })
            return accumulated
        }
      }

      return currentText
    }

    // Process all child nodes
    let remainingText = ''
    el.childNodes.forEach(child => {
      remainingText = processNode(child, remainingText)
    })

    // Create final paragraph from remaining text
    if (remainingText.trim()) {
      blocks.push({
        id: BlockFactory.generateId(),
        type: 'paragraph',
        content: remainingText.trim(),
        styles: [],
      })
    }

    return blocks
  }

  /**
   * Convert HTML element to block data
   */
  private htmlElementToBlockData(el: Element): BlockData | null {
    const tagName = el.tagName.toLowerCase();
    const content = el.innerHTML || '';
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
        const items = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML || '');
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

  /**
   * Insert AI-generated content as new blocks
   * Called from AI panel when generating new content
   */
  insertAIContent(html: string): void {
    // Parse HTML into blocks
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);

    if (elements.length === 0) {
      console.warn('No content to insert from AI');
      return;
    }

    // Determine insertion point
    let insertIndex = this.blocks.length;
    if (this.selectedBlock) {
      insertIndex = this.blocks.indexOf(this.selectedBlock) + 1;
    }

    // Parse each element and create blocks
    elements.forEach((element, i) => {
      const blockData = this.parseHTMLElement(element as HTMLElement);
      if (blockData) {
        this.addBlock(blockData.type, insertIndex + i, blockData.content);
      }
    });

    // Scroll to first inserted block
    if (this.blocks[insertIndex]) {
      this.blocks[insertIndex].getElement().scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update textarea
    this.updateTextarea();
  }

  /**
   * Replace selected blocks with AI-edited content
   * Called from AI panel when editing existing content
   */
  replaceBlocksWithAI(html: string, oldBlocks: BaseBlock[]): void {
    if (oldBlocks.length === 0) {
      console.warn('No blocks to replace');
      return;
    }

    // Parse HTML into blocks
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);

    if (elements.length === 0) {
      console.warn('No content from AI to replace with');
      return;
    }

    // Find index of first old block
    const firstIndex = this.blocks.indexOf(oldBlocks[0]);
    if (firstIndex === -1) {
      console.warn('Old blocks not found in editor');
      return;
    }

    // Remove old blocks
    oldBlocks.forEach(block => {
      this.removeBlock(block);
    });

    // Insert new blocks at the same position
    elements.forEach((element, i) => {
      const blockData = this.parseHTMLElement(element as HTMLElement);
      if (blockData) {
        this.addBlock(blockData.type, firstIndex + i, blockData.content);
      }
    });

    // Scroll to first replaced block
    if (this.blocks[firstIndex]) {
      this.blocks[firstIndex].getElement().scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update textarea
    this.updateTextarea();
  }

  /**
   * Parse HTML element into BlockData
   * Helper for AI content insertion
   */
  private parseHTMLElement(element: HTMLElement): BlockData | null {
    const tagName = element.tagName.toLowerCase();
    let type: BlockType | null = null;
    let content: string | string[] = '';
    const metadata: any = {};

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        type = 'heading';
        content = element.innerHTML || '';
        metadata.level = parseInt(tagName[1]);
        break;

      case 'p':
        type = 'paragraph';
        content = element.innerHTML || '';
        break;

      case 'ul':
      case 'ol':
        type = 'list';
        content = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML || '');
        metadata.ordered = tagName === 'ol';
        break;

      case 'blockquote':
        type = 'quote';
        content = element.innerHTML || '';
        break;

      case 'pre':
        type = 'code';
        const codeEl = element.querySelector('code');
        content = codeEl ? codeEl.textContent || '' : element.textContent || '';
        const langClass = codeEl?.className.match(/language-(\w+)/);
        if (langClass) {
          metadata.language = langClass[1];
        }
        break;

      case 'img':
        type = 'image';
        content = element.getAttribute('src') || '';
        break;

      default:
        // If unknown tag but has text, treat as paragraph
        if (element.textContent && element.textContent.trim()) {
          type = 'paragraph';
          content = element.innerHTML;
        }
    }

    if (!type) {
      return null;
    }

    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      styles: [],
      metadata
    };
  }
}