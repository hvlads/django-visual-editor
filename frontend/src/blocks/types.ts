/**
 * Block types and interfaces for the block-based editor
 */

export type BlockType = 'heading' | 'paragraph' | 'list' | 'code' | 'quote' | 'image';

export interface InlineStyles {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: string;      // e.g., '14px', '1.125rem'
  color?: string;         // e.g., '#111827', 'rgb(17, 24, 39)'
  fontWeight?: 'normal' | 'bold' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

export interface BlockData {
  id: string;
  type: BlockType;
  content: string | string[];
  styles: string[];       // Custom CSS classes (for user extensions)
  inlineStyles?: InlineStyles;  // Inline styles
  metadata?: {
    level?: number;        // For headings (1-6)
    language?: string;     // For code blocks
    ordered?: boolean;     // For lists
    width?: number;        // For images (width in pixels)
  };
}

export interface BlockConfig {
  type: BlockType;
  icon: string;
  label: string;
  tagName: string;
  defaultClasses?: string[];
}

export interface BlockPosition {
  index: number;
  element: HTMLElement;
}