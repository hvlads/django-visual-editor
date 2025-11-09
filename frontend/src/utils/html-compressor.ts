/**
 * Converts HTML to compressed format with inline styles
 */
export class HtmlCompressor {

  /**
   * Style mappings for common formatting tags
   */
  private static readonly STYLE_MAP: Record<string, string> = {
    'B': 'font-weight:bold',
    'STRONG': 'font-weight:bold',
    'I': 'font-style:italic',
    'EM': 'font-style:italic',
    'U': 'text-decoration:underline',
    'STRIKE': 'text-decoration:line-through',
    'H1': 'font-size:2em;font-weight:bold;margin:0.67em 0',
    'H2': 'font-size:1.5em;font-weight:bold;margin:0.75em 0',
    'H3': 'font-size:1.17em;font-weight:bold;margin:0.83em 0',
    'H4': 'font-size:1em;font-weight:bold;margin:1.12em 0',
    'H5': 'font-size:0.83em;font-weight:bold;margin:1.5em 0',
    'H6': 'font-size:0.67em;font-weight:bold;margin:1.67em 0',
  };

  /**
   * Tags that should be preserved as-is (not converted to spans)
   */
  private static readonly PRESERVE_TAGS = ['CODE', 'PRE', 'IMG', 'A'];

  /**
   * Compresses HTML by converting tags to inline styles
   */
  static compress(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Preserve content of PRE and CODE tags before compression
    const preservedContent: { [key: string]: string } = {};
    let placeholderIndex = 0;

    const preserveCodeContent = (element: HTMLElement) => {
      const preTags = element.querySelectorAll('pre');
      preTags.forEach(pre => {
        const placeholder = `__PRESERVE_PRE_${placeholderIndex}__`;
        preservedContent[placeholder] = pre.innerHTML;
        pre.innerHTML = placeholder;
        placeholderIndex++;
      });

      // Also preserve standalone code tags (not inside pre)
      const codeTags = element.querySelectorAll('code');
      codeTags.forEach(code => {
        // Skip if inside pre (already handled)
        if (code.closest('pre')) return;

        const placeholder = `__PRESERVE_CODE_${placeholderIndex}__`;
        preservedContent[placeholder] = code.innerHTML;
        code.innerHTML = placeholder;
        placeholderIndex++;
      });
    };

    preserveCodeContent(div);

    this.processNode(div);

    // Remove extra whitespace and newlines
    let compressed = div.innerHTML;
    compressed = compressed.replace(/\s+/g, ' ');
    compressed = compressed.replace(/>\s+</g, '><');

    // Restore preserved content
    Object.keys(preservedContent).forEach(placeholder => {
      compressed = compressed.replace(placeholder, preservedContent[placeholder]);
    });

    return compressed.trim();
  }

  /**
   * Recursively process nodes to convert to inline styles
   */
  private static processNode(node: HTMLElement): void {
    const nodesToProcess: HTMLElement[] = [];

    // Collect all child elements
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        nodesToProcess.push(child as HTMLElement);
      }
    }

    // Process children
    nodesToProcess.forEach(child => {
      const tagName = child.tagName;

      // Skip preserved tags
      if (this.PRESERVE_TAGS.includes(tagName)) {
        // Still process children of preserved tags (except PRE and CODE)
        if (tagName !== 'PRE' && tagName !== 'CODE') {
          this.processNode(child);
        }
        return;
      }

      // Convert formatting tags to spans with inline styles
      if (this.STYLE_MAP[tagName]) {
        const span = document.createElement('span');
        const existingStyle = child.getAttribute('style') || '';
        const newStyle = this.STYLE_MAP[tagName];
        span.setAttribute('style', existingStyle ? `${existingStyle};${newStyle}` : newStyle);

        // Move all children to span
        while (child.firstChild) {
          span.appendChild(child.firstChild);
        }

        // Replace original element with span
        child.parentNode?.replaceChild(span, child);
        this.processNode(span);
      } else {
        this.processNode(child);
      }
    });
  }

  /**
   * Decompresses HTML by converting inline styles back to semantic tags
   */
  static decompress(html: string): string {
    // For now, just return as-is since we're storing compressed format
    return html;
  }
}
