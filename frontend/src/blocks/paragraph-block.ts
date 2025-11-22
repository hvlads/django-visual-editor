import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * Paragraph block
 */
export class ParagraphBlock extends BaseBlock {
  protected renderContent(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';

    return `<p contenteditable="true" data-editable${classes}>${content || 'Start typing...'}</p>`;
  }

  protected getTagLabel(): string {
    return 'P';
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

    return `<p${classes}${styles}>${content}</p>`;
  }
}