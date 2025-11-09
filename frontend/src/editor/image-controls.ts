/**
 * Image controls for resizing and alignment
 */
export class ImageControls {
  private controlPanel: HTMLElement | null = null;
  private currentImage: HTMLImageElement | null = null;
  private isResizing: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;
  private onChangeCallback: (() => void) | null = null;

  constructor() {
    this.createControlPanel();
    this.attachGlobalListeners();
  }

  /**
   * Set callback to be called when image changes
   */
  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * Create the control panel
   */
  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'image-control-panel';
    this.controlPanel.innerHTML = `
      <div class="image-control-buttons">
        <button type="button" class="image-control-btn" data-action="align-left" title="Align Left">
          ⬅️
        </button>
        <button type="button" class="image-control-btn" data-action="align-center" title="Align Center">
          ↔️
        </button>
        <button type="button" class="image-control-btn" data-action="align-right" title="Align Right">
          ➡️
        </button>
        <span class="image-control-separator">|</span>
        <button type="button" class="image-control-btn" data-action="size-small" title="Small (25%)">
          S
        </button>
        <button type="button" class="image-control-btn" data-action="size-medium" title="Medium (50%)">
          M
        </button>
        <button type="button" class="image-control-btn" data-action="size-large" title="Large (75%)">
          L
        </button>
        <button type="button" class="image-control-btn" data-action="size-full" title="Full Width (100%)">
          XL
        </button>
        <span class="image-control-separator">|</span>
        <button type="button" class="image-control-btn image-control-delete" data-action="delete" title="Delete Image">
          🗑️
        </button>
      </div>
      <div class="image-resize-handle" title="Drag to resize"></div>
    `;

    document.body.appendChild(this.controlPanel);

    // Add event listeners to buttons
    this.controlPanel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.image-control-btn') as HTMLButtonElement;
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAction(button.dataset.action || '');
      }
    });

    // Add resize handle listeners
    const resizeHandle = this.controlPanel.querySelector('.image-resize-handle') as HTMLElement;
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
    }
  }

  /**
   * Attach global listeners
   */
  private attachGlobalListeners(): void {
    document.addEventListener('mousemove', (e) => this.onResize(e));
    document.addEventListener('mouseup', () => this.stopResize());
  }

  /**
   * Show controls for an image
   */
  showControls(image: HTMLImageElement): void {
    this.currentImage = image;

    if (!this.controlPanel) return;

    // Add selected class to image
    image.classList.add('image-selected');

    // Position control panel above the image
    const rect = image.getBoundingClientRect();
    this.controlPanel.style.display = 'block';
    this.controlPanel.style.top = `${rect.top + window.scrollY - 45}px`;
    this.controlPanel.style.left = `${rect.left + window.scrollX}px`;
    this.controlPanel.style.width = `${rect.width}px`;
  }

  /**
   * Hide controls
   */
  hideControls(): void {
    if (this.currentImage) {
      this.currentImage.classList.remove('image-selected');
      this.currentImage = null;
    }

    if (this.controlPanel) {
      this.controlPanel.style.display = 'none';
    }
  }

  /**
   * Handle control actions
   */
  private handleAction(action: string): void {
    if (!this.currentImage) return;

    switch (action) {
      case 'align-left':
        this.currentImage.style.display = 'block';
        this.currentImage.style.marginLeft = '0';
        this.currentImage.style.marginRight = 'auto';
        break;

      case 'align-center':
        this.currentImage.style.display = 'block';
        this.currentImage.style.marginLeft = 'auto';
        this.currentImage.style.marginRight = 'auto';
        break;

      case 'align-right':
        this.currentImage.style.display = 'block';
        this.currentImage.style.marginLeft = 'auto';
        this.currentImage.style.marginRight = '0';
        break;

      case 'size-small':
        this.currentImage.style.width = '25%';
        this.currentImage.style.height = 'auto';
        break;

      case 'size-medium':
        this.currentImage.style.width = '50%';
        this.currentImage.style.height = 'auto';
        break;

      case 'size-large':
        this.currentImage.style.width = '75%';
        this.currentImage.style.height = 'auto';
        break;

      case 'size-full':
        this.currentImage.style.width = '100%';
        this.currentImage.style.height = 'auto';
        break;

      case 'delete':
        if (confirm('Delete this image?')) {
          this.currentImage.remove();
          this.hideControls();
          // Notify about change
          if (this.onChangeCallback) {
            this.onChangeCallback();
          }
        }
        return;
    }

    // Update control panel position
    this.showControls(this.currentImage);

    // Notify about change
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  /**
   * Start resizing
   */
  private startResize(e: MouseEvent): void {
    if (!this.currentImage) return;

    e.preventDefault();
    e.stopPropagation();

    this.isResizing = true;
    this.startX = e.clientX;
    this.startWidth = this.currentImage.offsetWidth;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  /**
   * Handle resize
   */
  private onResize(e: MouseEvent): void {
    if (!this.isResizing || !this.currentImage) return;

    const deltaX = e.clientX - this.startX;
    const newWidth = this.startWidth + deltaX;

    // Get parent width for percentage calculation
    const parent = this.currentImage.parentElement;
    if (!parent) return;

    const parentWidth = parent.offsetWidth;
    const percentage = (newWidth / parentWidth) * 100;

    // Constrain between 10% and 100%
    const constrainedPercentage = Math.max(10, Math.min(100, percentage));

    this.currentImage.style.width = `${constrainedPercentage}%`;
    this.currentImage.style.height = 'auto';

    // Update control panel position
    this.showControls(this.currentImage);
  }

  /**
   * Stop resizing
   */
  private stopResize(): void {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Notify about change after resize completes
      if (this.onChangeCallback) {
        this.onChangeCallback();
      }
    }
  }

  /**
   * Check if click is inside control panel
   */
  isClickInsidePanel(target: HTMLElement): boolean {
    return this.controlPanel?.contains(target) || false;
  }
}
