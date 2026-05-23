import { BaseBlock } from '../blocks/base-block'
import { AIConfig } from './ai-assistant-panel'

export interface AIDialogCallbacks {
  onInsert: (html: string) => void;
  onReplace: (html: string, range?: Range) => void;
}

/**
 * AI panel — slides in from the right side of the screen.
 * Shows selected text, accepts an instruction, previews result before applying.
 */
export class AIFloatingDialog {
  private panelElement!: HTMLElement
  private promptTextarea!: HTMLTextAreaElement
  private modelSelect!: HTMLSelectElement
  private submitBtn!: HTMLButtonElement
  private errorElement!: HTMLElement
  private selectionSection!: HTMLElement
  private selectionText!: HTMLElement
  private resultSection!: HTMLElement
  private resultContent!: HTMLElement

  private isVisible: boolean = false
  private savedRange: Range | null = null
  private selectionHtml: string = ''
  private pendingHtml: string = ''
  private callbacks: AIDialogCallbacks | null = null

  // Legacy block context (kept for block editor compat, not shown in UI)
  private contextBlocks: BaseBlock[] = []

  // Speech recognition
  private recognition: any = null
  private isRecording: boolean = false

  constructor(
    private editor: any,
    private config: AIConfig,
    callbacks?: AIDialogCallbacks
  ) {
    this.callbacks = callbacks || null
    this.render()
    this.attachEvents()
    this.setupSpeech()
  }

  private render(): void {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ai-floating-dialog'
    this.panelElement.innerHTML = `
      <div class="ai-panel-header">
        <div class="ai-panel-title">
          <span class="ai-panel-icon">✦</span>
          AI Assistant
        </div>
        <button type="button" class="ai-panel-close" title="Close">×</button>
      </div>

      <div class="ai-panel-body">
        <!-- Selected text chip -->
        <div class="ai-panel-selection" style="display:none">
          <div class="ai-panel-selection-label">Editing selection</div>
          <div class="ai-panel-selection-text"></div>
        </div>

        <!-- Instruction input -->
        <div class="ai-panel-input-section">
          <div class="ai-panel-prompt-wrap">
            <textarea
              class="ai-panel-prompt"
              placeholder="What should AI do with this text?"
              rows="3"
            ></textarea>
            <button type="button" class="ai-panel-mic" title="Dictate">
              <svg class="mic-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2.5 8a5.5 5.5 0 0 0 11 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="8" y1="13.5" x2="8" y2="15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <select class="ai-panel-model">
            <option value="">Default model</option>
            ${this.config.models.map(m =>
              `<option value="${m.id}">${m.name} (${m.provider})</option>`
            ).join('')}
          </select>

          <button type="button" class="ai-panel-submit">
            <span class="ai-panel-submit-text">✦ Generate</span>
            <span class="ai-panel-submit-loading" style="display:none">
              <span class="ai-spinner"></span> Thinking...
            </span>
          </button>
        </div>

        <!-- Error -->
        <div class="ai-panel-error" style="display:none"></div>

        <!-- Result preview (shown after AI responds) -->
        <div class="ai-panel-result" style="display:none">
          <div class="ai-panel-result-label">Proposed edit</div>
          <div class="ai-panel-result-content"></div>
          <div class="ai-panel-result-actions">
            <button type="button" class="ai-panel-apply">Заменить</button>
            <button type="button" class="ai-panel-insert-after" style="display:none">Вставить после</button>
            <button type="button" class="ai-panel-retry">Ещё раз</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(this.panelElement)

    this.promptTextarea = this.panelElement.querySelector('.ai-panel-prompt')!
    this.modelSelect = this.panelElement.querySelector('.ai-panel-model')!
    this.submitBtn = this.panelElement.querySelector('.ai-panel-submit')!
    this.errorElement = this.panelElement.querySelector('.ai-panel-error')!
    this.selectionSection = this.panelElement.querySelector('.ai-panel-selection')!
    this.selectionText = this.panelElement.querySelector('.ai-panel-selection-text')!
    this.resultSection = this.panelElement.querySelector('.ai-panel-result')!
    this.resultContent = this.panelElement.querySelector('.ai-panel-result-content')!
  }

  private attachEvents(): void {
    this.panelElement.querySelector('.ai-panel-close')!
      .addEventListener('click', () => this.hide())

    this.submitBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this.sendPrompt()
    })

    this.promptTextarea.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        this.sendPrompt()
      }
      if (e.key === 'Escape') this.hide()
    })

    this.panelElement.querySelector('.ai-panel-apply')!
      .addEventListener('click', (e) => {
        e.preventDefault()
        this.applyResult(false)
      })

    this.panelElement.querySelector('.ai-panel-insert-after')!
      .addEventListener('click', (e) => {
        e.preventDefault()
        this.applyResult(true)
      })

    this.panelElement.querySelector('.ai-panel-retry')!
      .addEventListener('click', (e) => {
        e.preventDefault()
        this.hideResult()
        setTimeout(() => this.promptTextarea.focus(), 50)
      })

    // Close on outside click
    document.addEventListener('mousedown', (e) => {
      if (this.isVisible && !this.panelElement.contains(e.target as Node)) {
        this.hide()
      }
    })
  }

  private setupSpeech(): void {
    const micBtn = this.panelElement.querySelector('.ai-panel-mic') as HTMLButtonElement
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SR) {
      // Not supported or HTTP context — show but disabled with tooltip
      micBtn.disabled = true
      micBtn.title = 'Speech recognition requires HTTPS'
      micBtn.classList.add('not-supported')
      return
    }

    this.recognition = new SR()
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = navigator.language || 'ru-RU'

    micBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (this.isRecording) {
        this.recognition.stop()
      } else {
        try {
          this.recognition.start()
        } catch {
          // already started
        }
      }
    })

    this.recognition.onstart = () => {
      this.isRecording = true
      micBtn.classList.add('recording')
      micBtn.title = 'Stop recording'
    }

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Auto-restart for continuous feel
        setTimeout(() => {
          if (this.isRecording) {
            try { this.recognition.start(); } catch {}
          }
        }, 150)
        return
      }
      micBtn.classList.remove('recording')
      micBtn.title = 'Dictate'
    }

    this.recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        if (this.isRecording) {
          try { this.recognition.start(); } catch {}
        }
        return
      }
      this.isRecording = false
      micBtn.classList.remove('recording')
      micBtn.title = 'Dictate'
      if (e.error === 'not-allowed') {
        this.showError('Microphone access denied. Allow it in browser settings.')
      }
    }

    this.recognition.onresult = (e: any) => {
      let finalTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        const cur = this.promptTextarea.value
        this.promptTextarea.value = cur + (cur && !cur.endsWith(' ') ? ' ' : '') + finalTranscript
        this.promptTextarea.dispatchEvent(new Event('input'))
      }
    }
  }

  show(): void {
    this.isVisible = true
    this.panelElement.classList.add('visible')
    setTimeout(() => this.promptTextarea.focus(), 80)
  }

  showWithSelection(html: string, range: Range): void {
    this.savedRange = range
    this.selectionHtml = html

    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const preview = (tmp.textContent || '').trim().substring(0, 250)

    this.selectionText.textContent = preview
    this.selectionSection.style.display = 'block'

    const submitText = this.panelElement.querySelector('.ai-panel-submit-text')!
    submitText.textContent = '✦ Edit selection'

    this.promptTextarea.placeholder = 'What should AI do with this text?'
    this.hideResult()
    this.show()
  }

  hide(): void {
    this.isVisible = false
    this.panelElement.classList.remove('visible')
    this.savedRange = null
    this.selectionHtml = ''
    this.pendingHtml = ''
    this.selectionSection.style.display = 'none'
    this.promptTextarea.value = ''
    this.promptTextarea.placeholder = 'What should AI do with this text?'
    const submitText = this.panelElement.querySelector('.ai-panel-submit-text')!
    submitText.textContent = '✦ Generate'
    this.hideResult()
    this.hideError()
  }

  /** Legacy: add block to context (not shown in UI but kept for compat). */
  addBlockToContext(block: BaseBlock): void {
    if (this.contextBlocks.find(b => b.getData().id === block.getData().id)) return
    this.contextBlocks.push(block)
    if (!this.isVisible) this.show()
  }

  private async sendPrompt(): Promise<void> {
    const prompt = this.promptTextarea.value.trim()
    if (!prompt) {
      this.showError('Enter a prompt first')
      return
    }

    this.setLoading(true)
    this.hideError()
    this.hideResult()

    try {
      const hasSelection = !!(this.savedRange && this.selectionHtml)
      const contextItems = hasSelection
        ? [this.selectionHtml]
        : this.contextBlocks.map(b => b.toHTML())

      const requestBody: any = {
        prompt,
        context_blocks: contextItems,
        mode: hasSelection || this.contextBlocks.length > 0 ? 'edit' : 'generate',
      }

      if (this.modelSelect.value) {
        requestBody.model = this.modelSelect.value
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        this.pendingHtml = data.content
        this.showResult(data.content)
      } else {
        this.showError(data.error || 'Unknown error')
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Network error')
    } finally {
      this.setLoading(false)
    }
  }

  private applyResult(insertAfter: boolean = false): void {
    if (!this.pendingHtml) return

    if (this.savedRange && insertAfter) {
      // Collapse range to end, then insert after the selection
      const range = this.savedRange.cloneRange()
      range.collapse(false) // collapse to end
      if (this.callbacks) {
        this.callbacks.onReplace(this.pendingHtml, range)
      } else {
        this.editor.replaceRangeWithAI?.(this.pendingHtml, range)
      }
    } else if (this.savedRange && !insertAfter) {
      if (this.callbacks) {
        this.callbacks.onReplace(this.pendingHtml, this.savedRange)
      } else {
        this.editor.replaceRangeWithAI?.(this.pendingHtml, this.savedRange)
      }
    } else if (this.contextBlocks.length > 0) {
      if (this.callbacks) {
        this.callbacks.onReplace(this.pendingHtml)
      } else {
        this.editor.replaceBlocksWithAI?.(this.pendingHtml, this.contextBlocks)
      }
    } else {
      if (this.callbacks) {
        this.callbacks.onInsert(this.pendingHtml)
      } else {
        this.editor.insertAIContent?.(this.pendingHtml)
      }
    }

    this.contextBlocks = []
    this.hide()
  }

  private showResult(html: string): void {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    this.resultContent.textContent = tmp.textContent || html
    this.resultSection.style.display = 'block'

    // Label depends on whether text is selected
    const applyBtn = this.panelElement.querySelector('.ai-panel-apply') as HTMLElement
    if (applyBtn) applyBtn.textContent = this.savedRange ? 'Заменить' : 'Вставить'

    const insertAfterBtn = this.panelElement.querySelector('.ai-panel-insert-after') as HTMLElement
    if (insertAfterBtn) {
      insertAfterBtn.style.display = this.savedRange ? 'block' : 'none'
    }
  }

  private hideResult(): void {
    this.resultSection.style.display = 'none'
    this.pendingHtml = ''
  }

  private setLoading(loading: boolean): void {
    this.submitBtn.disabled = loading
    const text = this.panelElement.querySelector('.ai-panel-submit-text') as HTMLElement
    const spinner = this.panelElement.querySelector('.ai-panel-submit-loading') as HTMLElement
    text.style.display = loading ? 'none' : 'flex'
    spinner.style.display = loading ? 'flex' : 'none'
  }

  private showError(msg: string): void {
    this.errorElement.textContent = msg
    this.errorElement.style.display = 'block'
  }

  private hideError(): void {
    this.errorElement.style.display = 'none'
  }

  private getCSRFToken(): string {
    for (let cookie of document.cookie.split(';')) {
      cookie = cookie.trim()
      if (cookie.startsWith('csrftoken=')) return cookie.substring('csrftoken='.length)
    }
    return ''
  }
}
