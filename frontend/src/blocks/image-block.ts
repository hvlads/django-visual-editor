import { BaseBlock } from './base-block';
import { BlockData } from './types';

/**
 * Image block
 */
export class ImageBlock extends BaseBlock {
  private imageUrl: string = '';
  private imageAlt: string = '';
  private imageWidth: number = 0; // 0 means auto/natural width
  private isResizing: boolean = false;
  private resizeStartX: number = 0;
  private resizeStartWidth: number = 0;

  protected renderContent(): string {
    const content = typeof this.data.content === 'string' ? this.data.content : '';

    // If we have a URL stored in content, use it
    if (content && content.startsWith('http')) {
      this.imageUrl = content;
    }

    // Load image width from metadata if available
    if (this.data.metadata?.width) {
      this.imageWidth = this.data.metadata.width;
    }

    if (this.imageUrl) {
      const widthStyle = this.imageWidth > 0 ? ` style="width: ${this.imageWidth}px;"` : '';
      return `
        <div class="image-block-container">
          <div class="image-wrapper">
            <img src="${this.imageUrl}" alt="${this.imageAlt}" class="block-image"${widthStyle}>
            <div class="image-resize-handle" title="Drag to resize"></div>
          </div>
          <div class="image-hint">💡 Double-click image to change, or use delete button to remove block</div>
        </div>
      `;
    } else {
      return `
        <div class="image-block-placeholder">
          <div class="upload-area" data-upload>
            <div class="upload-icon">🖼️</div>
            <div class="upload-text">Click to upload or drag & drop an image</div>
            <input type="file" accept="image/*" class="file-input" style="display: none;">
          </div>
        </div>
      `;
    }
  }

  protected getTagLabel(): string {
    return 'IMAGE';
  }

  protected setupContentEditing(): void {
    if (!this.contentElement) return;

    // Handle file upload
    const uploadArea = this.contentElement.querySelector('[data-upload]');
    const fileInput = this.contentElement.querySelector('.file-input') as HTMLInputElement;

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          this.handleImageUpload(file);
        }
      });

      // Drag & drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const dragEvent = e as DragEvent;
        const file = dragEvent.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          this.handleImageUpload(file);
        }
      });
    }

    // Handle double-click on image to change it
    const img = this.contentElement.querySelector('.block-image') as HTMLImageElement;

    if (img) {
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Create a temporary file input
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = 'image/*';
        tempInput.style.display = 'none';

        tempInput.addEventListener('change', (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            this.handleImageUpload(file);
          }
          tempInput.remove();
        });

        document.body.appendChild(tempInput);
        tempInput.click();
      });
    }

    // Handle resize
    const resizeHandle = this.contentElement.querySelector('.image-resize-handle');

    if (resizeHandle && img) {
      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.isResizing = true;
        this.resizeStartX = (e as MouseEvent).clientX;
        this.resizeStartWidth = img.offsetWidth;

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!this.isResizing) return;

          const deltaX = moveEvent.clientX - this.resizeStartX;
          const newWidth = Math.max(100, this.resizeStartWidth + deltaX);

          this.imageWidth = newWidth;
          img.style.width = `${newWidth}px`;
        };

        const handleMouseUp = () => {
          this.isResizing = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);

          // Save width to metadata
          if (!this.data.metadata) {
            this.data.metadata = {};
          }
          this.data.metadata.width = this.imageWidth;

          this.triggerChange();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });
    }

    // Apply inline styles after rendering (for alignment)
    this.applyInlineStyles();
  }

  /**
   * Handle image upload
   */
  private async handleImageUpload(file: File): Promise<void> {
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Show loading
    if (this.contentElement) {
      this.contentElement.innerHTML = '<div class="loading">Uploading... ⏳</div>';
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Get upload URL from config (passed from Django)
      const uploadUrl = this.getUploadUrl();

      // Upload image
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': this.getCSRFToken()
        }
      });

      const result = await response.json();

      if (result.success && result.url) {
        this.imageUrl = result.url;
        this.imageAlt = file.name;
        this.data.content = result.url;

        // Re-render with image
        if (this.contentElement) {
          this.contentElement.innerHTML = this.renderContent();
          this.setupContentEditing();
        }

        this.triggerChange();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      console.error('Upload URL used:', this.getUploadUrl());
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nUpload URL: ${this.getUploadUrl()}\n\nMake sure django_visual_editor.urls are included in your project's urls.py`);

      // Re-render upload area
      if (this.contentElement) {
        this.contentElement.innerHTML = this.renderContent();
        this.setupContentEditing();
      }
    }
  }

  /**
   * Remove image
   */
  private removeImage(): void {
    this.imageUrl = '';
    this.imageAlt = '';
    this.data.content = '';

    if (this.contentElement) {
      this.contentElement.innerHTML = this.renderContent();
      this.setupContentEditing();
    }

    this.triggerChange();
  }

  /**
   * Get upload URL from window config
   */
  private getUploadUrl(): string {
    // This should be set by Django template
    return (window as any).DJANGO_VISUAL_EDITOR_UPLOAD_URL || '/upload-image/';
  }

  /**
   * Get CSRF token
   */
  private getCSRFToken(): string {
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));

    return csrfCookie ? csrfCookie.split('=')[1] : '';
  }

  toHTML(): string {
    // Get URL from data.content
    const url = typeof this.data.content === 'string' ? this.data.content : '';

    if (!url) {
      return '';
    }

    // Get width from metadata
    const width = this.data.metadata?.width || 0;

    const classes = this.data.styles.length > 0 ? ` class="${this.data.styles.join(' ')}"` : '';
    const styles = this.stylesToString();
    const widthAttr = width > 0 ? ` width="${width}"` : '';

    // For images, wrap in div with styles for alignment
    const divStyles = this.stylesToString();
    if (divStyles) {
      return `<div${divStyles}><img src="${url}" alt="${this.imageAlt}"${classes}${widthAttr}></div>`;
    }

    return `<img src="${url}" alt="${this.imageAlt}"${classes}${widthAttr}>`;
  }

  /**
   * Don't allow focusing image block for editing
   */
  focus(): void {
    // Images don't need text editing focus
    this.select();
  }
}
