/**
 * Floating toolbar that appears when clicking an image in the editor.
 * Controls: align left / center / right, size S/M/L/Full, delete.
 */
export class ImageToolbar {
  private element: HTMLElement;
  private currentImage: HTMLImageElement | null = null;
  private currentFigure: HTMLElement | null = null;
  private onUpdate: (() => void) | null = null;

  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
    this.element = this.build();
    document.body.appendChild(this.element);
    this.bindOutsideClick();
  }

  private build(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'image-toolbar';
    el.style.display = 'none';
    el.innerHTML = `
      <button type="button" class="img-tb-btn" data-align="left" title="Align left">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 6h8M1 9h10M1 12h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </button>
      <button type="button" class="img-tb-btn" data-align="center" title="Center">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 6h8M2 9h10M4 12h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </button>
      <button type="button" class="img-tb-btn" data-align="right" title="Align right">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M5 6h8M3 9h10M7 12h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </button>
      <span class="img-tb-sep"></span>
      <button type="button" class="img-tb-btn" data-size="25" title="25% width">S</button>
      <button type="button" class="img-tb-btn" data-size="50" title="50% width">M</button>
      <button type="button" class="img-tb-btn" data-size="75" title="75% width">L</button>
      <button type="button" class="img-tb-btn" data-size="100" title="Full width">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M1 7l3-3M1 7l3 3M13 7l-3-3M13 7l-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="img-tb-sep"></span>
      <button type="button" class="img-tb-btn img-tb-delete" data-action="delete" title="Delete image">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M6 7v3M8 7v3M3 4l.7 7.5a.5.5 0 0 0 .5.5h5.6a.5.5 0 0 0 .5-.5L11 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `;

    // Don't steal focus from editor
    el.addEventListener('mousedown', e => e.preventDefault());

    el.querySelectorAll('[data-align]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setAlignment((btn as HTMLElement).dataset.align!);
      });
    });

    el.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setSize(parseInt((btn as HTMLElement).dataset.size!));
      });
    });

    el.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      this.deleteImage();
    });

    return el;
  }

  attachToImage(img: HTMLImageElement): void {
    // Deselect previous
    this.currentImage?.classList.remove('img-selected');

    this.currentImage = img;
    this.currentFigure = (img.closest('figure.editor-figure') as HTMLElement) || img.parentElement;

    img.classList.add('img-selected');
    this.updateActiveStates();
    this.reposition();
    this.element.style.display = 'flex';
  }

  private reposition(): void {
    if (!this.currentImage) return;
    const rect = this.currentImage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    let top = rect.top - 44;
    if (top < 8) top = rect.bottom + 8;

    this.element.style.position = 'fixed';
    this.element.style.left = `${cx}px`;
    this.element.style.top = `${top}px`;
    this.element.style.transform = 'translateX(-50%)';
    this.element.style.zIndex = '9990';
  }

  private setAlignment(align: string): void {
    if (!this.currentFigure) return;
    // Use inline style so alignment renders correctly on public pages too,
    // not just in admin where admin.css loads the modifier classes.
    this.currentFigure.style.textAlign = align;
    // Keep class only for toolbar active-state tracking
    ['left', 'center', 'right'].forEach(a =>
      this.currentFigure!.classList.remove(`editor-figure--${a}`)
    );
    this.currentFigure.classList.add(`editor-figure--${align}`);
    this.updateActiveStates();
    this.onUpdate?.();
  }

  private setSize(percent: number): void {
    if (!this.currentImage) return;
    this.currentImage.style.width = `${percent}%`;
    this.currentImage.style.maxWidth = `${percent}%`;
    this.updateActiveStates();
    this.reposition();
    this.onUpdate?.();
  }

  private deleteImage(): void {
    const toRemove = this.currentFigure?.tagName === 'FIGURE'
      ? this.currentFigure
      : this.currentImage;
    toRemove?.remove();
    this.hide();
    this.onUpdate?.();
  }

  private updateActiveStates(): void {
    const currentAlign = this.currentFigure?.style.textAlign || 'center';
    ['left', 'center', 'right'].forEach(align => {
      const btn = this.element.querySelector(`[data-align="${align}"]`);
      btn?.classList.toggle('active', currentAlign === align);
    });

    const currentWidth = this.currentImage?.style.width?.replace('%', '') || '100';
    [25, 50, 75, 100].forEach(size => {
      const btn = this.element.querySelector(`[data-size="${size}"]`);
      btn?.classList.toggle('active', currentWidth === String(size));
    });
  }

  hide(): void {
    this.currentImage?.classList.remove('img-selected');
    this.element.style.display = 'none';
    this.currentImage = null;
    this.currentFigure = null;
  }

  isVisible(): boolean {
    return this.element.style.display !== 'none';
  }

  private bindOutsideClick(): void {
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (!this.element.contains(target) && target.tagName !== 'IMG') {
        this.hide();
      }
    });
  }
}
