import { ToolbarButton, FormatCommand } from '../types';

/**
 * Toolbar for the visual editor
 */
export class Toolbar {
  private element: HTMLElement;
  private buttons: ToolbarButton[] = [
    { name: 'undo', icon: '↶', title: 'Undo (Ctrl+Z)', command: 'undo' },
    { name: 'redo', icon: '↷', title: 'Redo (Ctrl+Y)', command: 'redo' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'fontName', icon: '', title: 'Font Family', command: 'fontName' },
    { name: 'fontSize', icon: '', title: 'Font Size', command: 'fontSize' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'bold', icon: '<b>B</b>', title: 'Bold (Ctrl+B)', command: 'bold' },
    { name: 'italic', icon: '<i>I</i>', title: 'Italic (Ctrl+I)', command: 'italic' },
    { name: 'underline', icon: '<u>U</u>', title: 'Underline (Ctrl+U)', command: 'underline' },
    { name: 'strikethrough', icon: '<s>S</s>', title: 'Strikethrough', command: 'strikeThrough' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'h1', icon: 'H1', title: 'Heading 1', command: 'formatBlock', value: 'h1' },
    { name: 'h2', icon: 'H2', title: 'Heading 2', command: 'formatBlock', value: 'h2' },
    { name: 'h3', icon: 'H3', title: 'Heading 3', command: 'formatBlock', value: 'h3' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'ul', icon: '• List', title: 'Bullet List', command: 'insertUnorderedList' },
    { name: 'ol', icon: '1. List', title: 'Numbered List', command: 'insertOrderedList' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'code', icon: '&lt;code&gt;', title: 'Inline Code', command: 'insertCode' },
    { name: 'codeBlock', icon: '{ }', title: 'Code Block', command: 'insertCodeBlock' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'image', icon: '🖼️', title: 'Insert Image', command: 'insertImage' },
    { name: 'link', icon: '🔗', title: 'Insert Link', command: 'createLink' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'clear', icon: '✕', title: 'Clear Formatting', command: 'removeFormat' },
    { name: 'separator', icon: '|', title: '', command: '' },
    { name: 'source', icon: '&lt;/&gt;', title: 'View HTML Source', command: 'toggleSource' },
  ];

  private fontFamilies = [
    { name: 'Default', value: '' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  ];

  private fontSizes = [
    { name: '10px', value: '1' },
    { name: '12px', value: '2' },
    { name: '14px', value: '3' },
    { name: '16px', value: '4' },
    { name: '18px', value: '5' },
    { name: '20px', value: '6' },
    { name: '24px', value: '7' },
  ];

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Toolbar container not found: ${containerId}`);
    }
    this.element = container;
    this.render();
  }

  /**
   * Render the toolbar
   */
  private render(): void {
    this.element.className = 'visual-editor-toolbar';
    this.element.innerHTML = '';

    this.buttons.forEach(button => {
      if (button.name === 'separator') {
        const separator = document.createElement('span');
        separator.className = 'toolbar-separator';
        separator.innerHTML = button.icon;
        this.element.appendChild(separator);
      } else if (button.name === 'fontName') {
        const select = this.createFontFamilySelect();
        this.element.appendChild(select);
      } else if (button.name === 'fontSize') {
        const select = this.createFontSizeSelect();
        this.element.appendChild(select);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toolbar-button';
        btn.title = button.title;
        btn.innerHTML = button.icon;
        btn.dataset.command = button.command;
        if (button.value) {
          btn.dataset.value = button.value;
        }
        this.element.appendChild(btn);
      }
    });
  }

  /**
   * Create font family dropdown
   */
  private createFontFamilySelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'toolbar-select';
    select.title = 'Font Family';

    this.fontFamilies.forEach(font => {
      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.name;
      if (font.value) {
        option.style.fontFamily = font.value;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.value) {
        this.onFontChange(target.value);
      }
    });

    return select;
  }

  /**
   * Create font size dropdown
   */
  private createFontSizeSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'toolbar-select';
    select.title = 'Font Size';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Size';
    select.appendChild(defaultOption);

    this.fontSizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size.value;
      option.textContent = size.name;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.value) {
        this.onSizeChange(target.value);
      }
    });

    return select;
  }

  private onFontChange: (font: string) => void = () => {};
  private onSizeChange: (size: string) => void = () => {};

  /**
   * Add event listener for toolbar actions
   */
  onAction(callback: (command: string, value?: string) => void): void {
    // Prevent buttons from stealing focus on mousedown
    this.element.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.toolbar-button') as HTMLButtonElement;

      if (button) {
        // Prevent default to keep focus on editor and preserve selection
        e.preventDefault();
      }
    });

    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.toolbar-button') as HTMLButtonElement;

      if (button) {
        e.preventDefault();
        const command = button.dataset.command;
        const value = button.dataset.value;

        if (command) {
          callback(command, value);
        }
      }
    });
  }

  /**
   * Set font change handler
   */
  onFontFamilyChange(callback: (font: string) => void): void {
    this.onFontChange = callback;
  }

  /**
   * Set font size change handler
   */
  onFontSizeChange(callback: (size: string) => void): void {
    this.onSizeChange = callback;
  }

  /**
   * Update button states based on current selection
   */
  updateButtonStates(): void {
    const buttons = this.element.querySelectorAll('.toolbar-button');

    buttons.forEach(button => {
      const btn = button as HTMLButtonElement;
      const command = btn.dataset.command as FormatCommand;

      if (command && this.isCommandActive(command)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Check if a format command is active in the current selection
   */
  private isCommandActive(command: FormatCommand): boolean {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }

  /**
   * Toggle the source button active state
   */
  setSourceMode(active: boolean): void {
    const buttons = this.element.querySelectorAll('.toolbar-button');
    buttons.forEach(button => {
      const btn = button as HTMLButtonElement;
      if (btn.dataset.command === 'toggleSource') {
        if (active) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  /**
   * Disable all buttons except source toggle
   */
  setButtonsDisabled(disabled: boolean): void {
    const buttons = this.element.querySelectorAll('.toolbar-button');
    buttons.forEach(button => {
      const btn = button as HTMLButtonElement;
      if (btn.dataset.command !== 'toggleSource') {
        btn.disabled = disabled;
      }
    });

    // Also disable select dropdowns
    const selects = this.element.querySelectorAll('.toolbar-select');
    selects.forEach(select => {
      (select as HTMLSelectElement).disabled = disabled;
    });
  }
}
