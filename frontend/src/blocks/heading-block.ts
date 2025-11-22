import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * Heading block (H1-H6)
 */
export class HeadingBlock extends BaseBlock {
  protected renderContent(): string {
    const level = this.data.metadata?.level || 1;
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';

    return `<h${level} contenteditable="true" data-editable${classes}>${content || 'Heading'}</h${level}>`;
  }

  protected getTagLabel(): string {
    const level = this.data.metadata?.level || 1;
    return `H${level}`;
  }

  protected setupContentEditing(): void {
    super.setupContentEditing();
    // Apply inline styles after rendering
    this.applyInlineStyles();
  }

  toHTML(): string {
    const level = this.data.metadata?.level || 1;
    const content = typeof this.data.content === 'string' ? this.data.content : '';
    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    const styles = this.stylesToString();

    return `<h${level}${classes}${styles}>${content}</h${level}>`;
  }
}