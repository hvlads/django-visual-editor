import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * Quote block
 */
export class QuoteBlock extends BaseBlock {
  protected renderContent(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    // Use innerHTML by default, don't escape HTML to preserve links and other formatting
    const displayContent = content || 'Quote text...';

    return `<blockquote contenteditable="true" data-editable${classes}>${displayContent}</blockquote>`;
  }

  protected getTagLabel(): string {
    return 'QUOTE';
  }

  protected setupContentEditing(): void {
    super.setupContentEditing();
    // Apply inline styles after rendering
    this.applyInlineStyles();
  }

  toHTML(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    const styles = this.stylesToString();

    return `<blockquote${classes}${styles}>${content}</blockquote>`;
  }
}