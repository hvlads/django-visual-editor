import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * Code block
 */
export class CodeBlock extends BaseBlock {
  protected renderContent(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const language = this.data.metadata?.language || 'text';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';

    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-language">${language}</span>
        </div>
        <pre data-editable${classes}><code contenteditable="true" spellcheck="false">${content || '// Enter your code here'}</code></pre>
      </div>
    `;
  }

  protected getTagLabel(): string {
    return 'CODE';
  }

  protected setupContentEditing(): void {
    if (!this.contentElement) return;

    const codeElement = this.contentElement.querySelector('code');
    if (!codeElement) return;

    codeElement.addEventListener('input', () => {
      this.updateContent();
      this.triggerChange();
    });

    codeElement.addEventListener('blur', () => {
      this.updateContent();
    });

    // Apply inline styles after rendering
    this.applyInlineStyles();
  }

  protected updateContent(): void {
    if (!this.contentElement) return;

    const codeElement = this.contentElement.querySelector('code');
    if (codeElement) {
      this.data.content = codeElement.textContent || '';
    }
  }

  toHTML(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    const styles = this.stylesToString();

    return `<pre${classes}${styles}><code>${this.escapeHtml(content)}</code></pre>`;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}