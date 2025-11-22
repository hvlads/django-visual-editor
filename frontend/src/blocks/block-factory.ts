import { BaseBlock } from './base-block';
import { HeadingBlock } from './heading-block';
import { ParagraphBlock } from './paragraph-block';
import { ListBlock } from './list-block';
import { CodeBlock } from './code-block';
import { QuoteBlock } from './quote-block';
import { ImageBlock } from './image-block';
import { BlockData, BlockType } from './types';

/**
 * Factory for creating blocks
 */
export class BlockFactory {
  /**
   * Create a block from data
   */
  static createBlock(data: BlockData): BaseBlock {
    switch (data.type) {
      case 'heading':
        return new HeadingBlock(data);
      case 'paragraph':
        return new ParagraphBlock(data);
      case 'list':
        return new ListBlock(data);
      case 'code':
        return new CodeBlock(data);
      case 'quote':
        return new QuoteBlock(data);
      case 'image':
        return new ImageBlock(data);
      default:
        return new ParagraphBlock(data);
    }
  }

  /**
   * Generate a unique ID
   */
  static generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create default block data
   */
  static createBlockData(type: BlockType, content: string | string[] = ''): BlockData {
    const data: BlockData = {
      id: this.generateId(),
      type,
      content,
      styles: []
    };

    // Set defaults based on type
    switch (type) {
      case 'heading':
        data.metadata = { level: 2 };
        break;
      case 'list':
        data.content = Array.isArray(content) ? content : [''];
        data.metadata = { ordered: false };
        break;
      case 'code':
        data.metadata = { language: 'javascript' };
        break;
    }

    return data;
  }
}