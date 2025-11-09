import { EditorConfig } from '../types';
import { Toolbar } from './toolbar';
import { ImageUploader } from '../utils/image-uploader';
import { HtmlCompressor } from '../utils/html-compressor';
import { ImageControls } from './image-controls';

/**
 * Main Visual Editor class
 */
export class VisualEditor {
  private editorElement: HTMLElement;
  private textareaElement: HTMLTextAreaElement;
  private sourceTextarea: HTMLTextAreaElement | null = null;
  private toolbar: Toolbar;
  private imageUploader: ImageUploader;
  private imageControls: ImageControls;
  private config: EditorConfig;
  private isSourceMode: boolean = false;

  constructor(
    editorId: string,
    textareaId: string,
    toolbarId: string,
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
    this.toolbar = new Toolbar(toolbarId);
    this.imageUploader = new ImageUploader(config.uploadUrl);
    this.imageControls = new ImageControls();

    // Set up image controls callback to update textarea when image changes
    this.imageControls.onChange(() => this.updateTextarea());

    this.init();
  }

  /**
   * Initialize the editor
   */
  private init(): void {
    // Set initial content
    if (this.textareaElement.value) {
      this.editorElement.innerHTML = this.textareaElement.value;
    }

    // Set placeholder
    if (this.config.placeholder && !this.textareaElement.value) {
      this.editorElement.dataset.placeholder = this.config.placeholder;
    }

    // Set height constraints
    if (this.config.minHeight) {
      this.editorElement.style.minHeight = `${this.config.minHeight}px`;
    }
    if (this.config.maxHeight) {
      this.editorElement.style.maxHeight = `${this.config.maxHeight}px`;
    }

    // Setup event listeners
    this.setupEventListeners();

    // Enable editing
    this.editorElement.contentEditable = 'true';
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Toolbar actions
    this.toolbar.onAction((command, value) => {
      this.executeCommand(command, value);
    });

    // Font family change
    this.toolbar.onFontFamilyChange((font) => {
      this.applyFontFamily(font);
    });

    // Font size change
    this.toolbar.onFontSizeChange((size) => {
      this.applyFontSize(size);
    });

    // Update toolbar on selection change
    this.editorElement.addEventListener('mouseup', () => {
      this.toolbar.updateButtonStates();
    });

    this.editorElement.addEventListener('keyup', () => {
      this.toolbar.updateButtonStates();
      this.updateTextarea();
    });

    // Update hidden textarea on input
    this.editorElement.addEventListener('input', () => {
      this.updateTextarea();
    });

    // Handle paste - clean up formatting
    this.editorElement.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    });

    // Handle image paste
    this.editorElement.addEventListener('paste', async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            await this.uploadAndInsertImage(file);
          }
        }
      }
    });

    // Handle drag and drop images
    this.editorElement.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          await this.uploadAndInsertImage(files[i]);
        }
      }
    });

    this.editorElement.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    // Keyboard shortcuts
    this.editorElement.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              // Ctrl+Shift+Z or Cmd+Shift+Z = Redo
              this.executeCommand('redo');
            } else {
              // Ctrl+Z or Cmd+Z = Undo
              this.executeCommand('undo');
            }
            break;
          case 'y':
            // Ctrl+Y = Redo (Windows/Linux style)
            e.preventDefault();
            this.executeCommand('redo');
            break;
          case 'b':
            e.preventDefault();
            this.executeCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            this.executeCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            this.executeCommand('underline');
            break;
        }
      }
    });

    // Handle image clicks for controls
    this.editorElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'IMG') {
        e.preventDefault();
        this.imageControls.showControls(target as HTMLImageElement);
      } else if (!this.imageControls.isClickInsidePanel(target)) {
        this.imageControls.hideControls();
      }
    });

    // Hide image controls when clicking outside editor
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!this.editorElement.contains(target) && !this.imageControls.isClickInsidePanel(target)) {
        this.imageControls.hideControls();
      }
    });
  }

  /**
   * Execute a formatting command
   */
  private executeCommand(command: string, value?: string): void {
    if (command === 'insertImage') {
      this.promptImageUpload();
      return;
    }

    if (command === 'createLink') {
      this.promptCreateLink();
      return;
    }

    if (command === 'toggleSource') {
      this.toggleSourceMode();
      return;
    }

    if (command === 'insertCode') {
      this.insertInlineCode();
      return;
    }

    if (command === 'insertCodeBlock') {
      this.insertCodeBlock();
      return;
    }

    if (command === 'removeFormat') {
      this.clearFormatting();
      return;
    }

    this.editorElement.focus();

    if (value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false);
    }

    this.toolbar.updateButtonStates();
    this.updateTextarea();
  }

  /**
   * Prompt user to upload an image
   */
  private promptImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await this.uploadAndInsertImage(file);
      }
    };

    input.click();
  }

  /**
   * Upload and insert image into editor
   */
  private async uploadAndInsertImage(file: File): Promise<void> {
    // Validate file
    const validation = ImageUploader.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Show loading indicator
    const loadingSpan = document.createElement('span');
    loadingSpan.textContent = '⏳ Uploading...';
    loadingSpan.style.color = '#999';
    this.insertNodeAtCursor(loadingSpan);

    // Upload image
    const result = await this.imageUploader.upload(file);

    // Remove loading indicator
    loadingSpan.remove();

    if (result.success && result.url) {
      const img = document.createElement('img');
      img.src = result.url;
      img.alt = file.name;
      img.style.maxWidth = '100%';
      img.dataset.imageId = result.id?.toString() || '';
      this.insertNodeAtCursor(img);
      this.updateTextarea();
    } else {
      alert(`Upload failed: ${result.error}`);
    }
  }

  /**
   * Prompt user to create a link
   */
  private promptCreateLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      this.updateTextarea();
    }
  }

  /**
   * Insert inline code at cursor
   */
  private insertInlineCode(): void {
    const selection = window.getSelection();
    if (!selection) return;

    this.editorElement.focus();

    // If there's selected text, wrap it in code tag or unwrap if already in code
    if (!selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Check if selection is already inside a code tag
      let node: Node | null = range.commonAncestorContainer;
      let codeElement: HTMLElement | null = null;

      // Traverse up to find code element
      while (node && node !== this.editorElement) {
        if (node.nodeName === 'CODE') {
          codeElement = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (codeElement) {
        // If already in code, unwrap it
        const parent = codeElement.parentNode;
        if (parent) {
          // Get text content
          const textNode = document.createTextNode(codeElement.textContent || '');
          parent.replaceChild(textNode, codeElement);

          // Select the unwrapped text
          const newRange = document.createRange();
          newRange.selectNodeContents(textNode);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Not in code, wrap it
        const code = document.createElement('code');

        try {
          range.surroundContents(code);
        } catch (e) {
          // If surroundContents fails (multi-element selection), use a different approach
          const selectedText = range.toString();
          code.textContent = selectedText;
          range.deleteContents();
          range.insertNode(code);
        }

        // Move cursor after code element
        range.setStartAfter(code);
        range.setEndAfter(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // No selection, check if cursor is inside code tag
      let node: Node | null = selection.anchorNode;
      let codeElement: HTMLElement | null = null;

      while (node && node !== this.editorElement) {
        if (node.nodeName === 'CODE') {
          codeElement = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (codeElement) {
        // If cursor is in code, unwrap it
        const parent = codeElement.parentNode;
        if (parent) {
          const textNode = document.createTextNode(codeElement.textContent || '');
          parent.replaceChild(textNode, codeElement);

          // Position cursor in the unwrapped text
          const range = document.createRange();
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Not in code, insert code placeholder
        const code = document.createElement('code');
        code.textContent = 'code';
        this.insertNodeAtCursor(code);

        // Select the placeholder text
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    this.updateTextarea();
  }

  /**
   * Insert code block at cursor
   */
  private insertCodeBlock(): void {
    const selection = window.getSelection();
    if (!selection) return;

    this.editorElement.focus();

    // Create pre > code structure
    const pre = document.createElement('pre');
    const code = document.createElement('code');

    // If there's selected text, use it as code content
    if (!selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      code.textContent = selectedText;
      range.deleteContents();
    } else {
      // No selection, insert placeholder
      code.textContent = '// Enter your code here';
    }

    pre.appendChild(code);
    this.insertNodeAtCursor(pre);

    // Add a line break after the code block for easy editing
    const br = document.createElement('br');
    this.insertNodeAtCursor(br);

    // Select the code content for easy editing
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);

    this.updateTextarea();
  }

  /**
   * Clear formatting from selected text
   */
  private clearFormatting(): void {
    this.editorElement.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection - do nothing
      return;
    }

    const range = selection.getRangeAt(0);

    // If nothing is selected, do nothing
    if (range.collapsed) {
      // Could optionally show a message to user
      return;
    }

    // Get the selected text content (plain text only)
    const selectedText = range.toString();

    // Create a text node with plain text
    const textNode = document.createTextNode(selectedText);

    // Replace selection with plain text
    range.deleteContents();
    range.insertNode(textNode);

    // Select the newly inserted text
    range.setStartBefore(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    this.toolbar.updateButtonStates();
    this.updateTextarea();
  }

  /**
   * Insert a node at the current cursor position
   */
  private insertNodeAtCursor(node: Node): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.editorElement.appendChild(node);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    // Move cursor after inserted node
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Update the hidden textarea with compressed HTML
   */
  private updateTextarea(): void {
    const html = this.editorElement.innerHTML;
    const compressed = HtmlCompressor.compress(html);
    this.textareaElement.value = compressed;
  }

  /**
   * Get the current editor content
   */
  getContent(): string {
    return this.textareaElement.value;
  }

  /**
   * Set the editor content
   */
  setContent(html: string): void {
    this.editorElement.innerHTML = html;
    this.updateTextarea();
  }

  /**
   * Clear the editor
   */
  clear(): void {
    this.editorElement.innerHTML = '';
    this.updateTextarea();
  }

  /**
   * Toggle between visual mode and HTML source mode
   */
  private toggleSourceMode(): void {
    this.isSourceMode = !this.isSourceMode;

    if (this.isSourceMode) {
      // Switch to source mode
      this.showSourceMode();
    } else {
      // Switch back to visual mode
      this.hideSourceMode();
    }

    // Update toolbar button state
    this.toolbar.setSourceMode(this.isSourceMode);
    this.toolbar.setButtonsDisabled(this.isSourceMode);
  }

  /**
   * Show HTML source mode
   */
  private showSourceMode(): void {
    // Create source textarea if it doesn't exist
    if (!this.sourceTextarea) {
      this.sourceTextarea = document.createElement('textarea');
      this.sourceTextarea.className = 'visual-editor-source';

      // Set height constraints
      if (this.config.minHeight) {
        this.sourceTextarea.style.minHeight = `${this.config.minHeight}px`;
      }
      if (this.config.maxHeight) {
        this.sourceTextarea.style.maxHeight = `${this.config.maxHeight}px`;
      }

      // Insert after the editor element
      this.editorElement.parentNode?.insertBefore(
        this.sourceTextarea,
        this.editorElement.nextSibling
      );
    }

    // Get current HTML and show in source textarea
    const currentHtml = this.editorElement.innerHTML;
    this.sourceTextarea.value = this.formatHtml(currentHtml);

    // Hide visual editor, show source
    this.editorElement.style.display = 'none';
    this.sourceTextarea.style.display = 'block';
    this.sourceTextarea.focus();
  }

  /**
   * Hide HTML source mode and return to visual mode
   */
  private hideSourceMode(): void {
    if (!this.sourceTextarea) return;

    // Get HTML from source textarea
    const sourceHtml = this.sourceTextarea.value;

    // Update visual editor
    this.editorElement.innerHTML = sourceHtml;

    // Hide source, show visual editor
    this.sourceTextarea.style.display = 'none';
    this.editorElement.style.display = 'block';

    // Save HTML as-is without compression when edited in source mode
    // User manually edited HTML, so we preserve it exactly as written
    this.textareaElement.value = sourceHtml;

    this.editorElement.focus();
  }

  /**
   * Format HTML with basic indentation for readability
   */
  private formatHtml(html: string): string {
    // Simple HTML formatting - add newlines and indentation
    let formatted = html;

    // Add newlines after closing tags
    formatted = formatted.replace(/(<\/[^>]+>)/g, '$1\n');

    // Add newlines before opening tags (except inline elements)
    formatted = formatted.replace(/(<(?!\/)(img|br|input|span|a|b|i|u|strong|em)[^>]*>)/gi, '$1');
    formatted = formatted.replace(/(<(?!\/)(?!img|br|input|span|a|b|i|u|strong|em)[^>]+>)/gi, '\n$1');

    // Clean up extra newlines
    formatted = formatted.replace(/\n\s*\n/g, '\n');
    formatted = formatted.trim();

    return formatted;
  }

  /**
   * Apply font family to selection
   */
  private applyFontFamily(font: string): void {
    this.editorElement.focus();

    if (font) {
      // Use execCommand for font name
      document.execCommand('fontName', false, font);
    } else {
      // Remove font styling
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontFamily = '';
        range.surroundContents(span);
      }
    }

    this.updateTextarea();
  }

  /**
   * Apply font size to selection
   */
  private applyFontSize(size: string): void {
    this.editorElement.focus();
    document.execCommand('fontSize', false, size);
    this.updateTextarea();
  }
}
