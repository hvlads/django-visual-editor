/**
 * AI Assistant Panel
 * Sidebar panel for AI-powered content generation and editing
 */

import { BaseBlock } from '../blocks/base-block'
import { BlockEditor } from './block-editor'

export interface AIConfig {
  enabled: boolean
  endpoint: string
  models: Array<{
    id: string
    name: string
    provider: string
  }>
  defaultModel: string
}

export class AIAssistantPanel {
  private panelElement!: HTMLElement
  private promptTextarea!: HTMLTextAreaElement
  private additionalInstructionsTextarea!: HTMLTextAreaElement
  private modelSelect!: HTMLSelectElement
  private contextList!: HTMLElement
  private contextCount!: HTMLElement
  private generateBtn!: HTMLButtonElement
  private errorElement!: HTMLElement

  private isOpen: boolean = true
  private contextBlocks: BaseBlock[] = []
  private mode: 'generate' | 'edit' = 'generate'
  private selectedModel: string

  constructor(
    private editor: BlockEditor,
    private config: AIConfig
  ) {
    this.selectedModel = ''  // Empty = use default model from backend
    this.render()
    this.attachEvents()
  }

  /**
   * Render the AI panel UI
   */
  private render(): void {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ai-assistant-panel'
    this.panelElement.innerHTML = `
      <div class="ai-panel-header">
        <div class="ai-panel-title">
          <span class="ai-icon">🤖</span>
          <h3>AI Assistant</h3>
        </div>
        <button type="button" class="ai-panel-toggle" title="Toggle panel">
          <span class="toggle-icon">‹</span>
        </button>
      </div>

      <div class="ai-panel-body">
        <!-- Model Selector -->
        <div class="ai-field">
          <label for="ai-model-select">AI Model</label>
          <select id="ai-model-select" class="ai-model-select">
            <option value="">Default Model</option>
            ${this.config.models.map(m =>
              `<option value="${m.id}" ${m.id === this.selectedModel ? 'selected' : ''}>
                ${m.name} (${m.provider})
              </option>`
            ).join('')}
          </select>
        </div>

        <!-- Mode Tabs -->
        <div class="ai-tabs">
          <button type="button" class="ai-tab active" data-mode="generate">
            <span class="tab-icon">✨</span> Generate
          </button>
          <button type="button" class="ai-tab" data-mode="edit">
            <span class="tab-icon">✏️</span> Edit
          </button>
        </div>

        <!-- Quick Guide -->
        <div class="ai-quick-guide">
          <div class="quick-guide-title">📖 Quick Guide</div>
          <ul class="quick-guide-list">
            <li><strong>Generate:</strong> Create new content from scratch</li>
            <li><strong>Edit:</strong> Improve existing blocks (add to context first)</li>
            <li><strong>Context:</strong> Click 🤖 on blocks to reference them</li>
          </ul>
        </div>

        <!-- Context Blocks Section -->
        <div class="ai-context-section">
          <div class="ai-context-header">
            <span>Context Blocks: <span class="context-count">0</span></span>
            <button type="button" class="ai-context-clear" title="Clear all context blocks">Clear</button>
          </div>
          <div class="ai-context-list"></div>
          <div class="ai-context-empty">
            <p>No blocks in context. Click 🤖 on any block to add it.</p>
          </div>
        </div>

        <!-- Main Prompt Field -->
        <div class="ai-field">
          <label for="ai-prompt">Your Request</label>
          <textarea
            id="ai-prompt"
            class="ai-prompt-textarea"
            placeholder="E.g., 'Write an introduction about Django ORM' or 'Improve the text clarity'..."
            rows="4"
          ></textarea>
        </div>

        <!-- Additional Instructions Field -->
        <div class="ai-field">
          <label for="ai-additional-instructions">
            Additional Instructions
            <span class="ai-hint">(optional)</span>
          </label>
          <textarea
            id="ai-additional-instructions"
            class="ai-additional-instructions"
            placeholder="E.g., 'Use formal tone', 'Add code examples', 'Keep it short'..."
            rows="3"
          ></textarea>
          <div class="ai-field-hint">
            These instructions supplement the main prompt and system prompts.
          </div>
        </div>

        <!-- Generate Button -->
        <button type="button" class="ai-generate-btn">
          <span class="btn-text">
            <span class="btn-icon">✨</span>
            <span class="btn-label">Generate</span>
          </span>
          <span class="btn-loading" style="display: none;">
            <span class="spinner"></span> Generating...
          </span>
        </button>

        <!-- Error Display -->
        <div class="ai-error" style="display: none;"></div>
      </div>
    `

    // Get element references
    this.promptTextarea = this.panelElement.querySelector('.ai-prompt-textarea')!
    this.additionalInstructionsTextarea = this.panelElement.querySelector('.ai-additional-instructions')!
    this.modelSelect = this.panelElement.querySelector('.ai-model-select')!
    this.contextList = this.panelElement.querySelector('.ai-context-list')!
    this.contextCount = this.panelElement.querySelector('.context-count')!
    this.generateBtn = this.panelElement.querySelector('.ai-generate-btn')!
    this.errorElement = this.panelElement.querySelector('.ai-error')!
  }

  /**
   * Attach event listeners
   */
  private attachEvents(): void {
    // Toggle panel
    const toggleBtn = this.panelElement.querySelector('.ai-panel-toggle')!
    toggleBtn.addEventListener('click', () => this.toggle())

    // Mode tabs
    this.panelElement.querySelectorAll('.ai-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const mode = (e.currentTarget as HTMLElement).dataset.mode as 'generate' | 'edit'
        this.setMode(mode)
      })
    })

    // Model selection
    this.modelSelect.addEventListener('change', (e) => {
      this.selectedModel = (e.target as HTMLSelectElement).value
    })

    // Clear context
    const clearBtn = this.panelElement.querySelector('.ai-context-clear')!
    clearBtn.addEventListener('click', () => this.clearContext())

    // Generate button
    this.generateBtn.addEventListener('click', () => this.sendPrompt())

    // Enter to submit (Ctrl/Cmd + Enter in textareas)
    this.promptTextarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        this.sendPrompt()
      }
    })
  }

  /**
   * Toggle panel open/closed
   */
  toggle(): void {
    this.isOpen = !this.isOpen
    this.panelElement.classList.toggle('collapsed', !this.isOpen)

    const toggleIcon = this.panelElement.querySelector('.toggle-icon')!
    toggleIcon.textContent = this.isOpen ? '‹' : '›'
  }

  /**
   * Open the panel
   */
  open(): void {
    if (!this.isOpen) {
      this.toggle()
    }
  }

  /**
   * Set mode (generate or edit)
   */
  private setMode(mode: 'generate' | 'edit'): void {
    this.mode = mode

    // Update tab UI
    this.panelElement.querySelectorAll('.ai-tab').forEach(tab => {
      const tabMode = (tab as HTMLElement).dataset.mode
      tab.classList.toggle('active', tabMode === mode)
    })

    // Update button label
    const btnLabel = this.panelElement.querySelector('.btn-label')!
    const btnIcon = this.panelElement.querySelector('.btn-icon')!
    if (mode === 'generate') {
      btnLabel.textContent = 'Generate'
      btnIcon.textContent = '✨'
    } else {
      btnLabel.textContent = 'Apply Edits'
      btnIcon.textContent = '✏️'
    }

    // Update placeholder
    if (mode === 'generate') {
      this.promptTextarea.placeholder = "E.g., 'Write an introduction about Django ORM'..."
    } else {
      this.promptTextarea.placeholder = "E.g., 'Improve clarity and fix grammar'..."
    }
  }

  /**
   * Add block to context
   */
  addBlockToContext(block: BaseBlock): void {
    // Check if already in context
    if (this.contextBlocks.find(b => b.getData().id === block.getData().id)) {
      return
    }

    this.contextBlocks.push(block)
    this.updateContextList()

    // Open panel if closed
    if (!this.isOpen) {
      this.open()
    }

    // Clear any error
    this.hideError()
  }

  /**
   * Remove block from context
   */
  private removeFromContext(blockId: string): void {
    this.contextBlocks = this.contextBlocks.filter(b => b.getData().id !== blockId)
    this.updateContextList()
  }

  /**
   * Clear all context blocks
   */
  private clearContext(): void {
    this.contextBlocks = []
    this.updateContextList()
  }

  /**
   * Update the context blocks list UI
   */
  private updateContextList(): void {
    this.contextCount.textContent = String(this.contextBlocks.length)

    const emptyState = this.panelElement.querySelector('.ai-context-empty') as HTMLElement

    if (this.contextBlocks.length === 0) {
      this.contextList.innerHTML = ''
      emptyState.style.display = 'block'
    } else {
      emptyState.style.display = 'none'

      this.contextList.innerHTML = this.contextBlocks.map(block => {
        const preview = this.getBlockPreview(block)
        const type = block.getData().type
        return `
          <div class="context-block-item" data-block-id="${block.getData().id}">
            <span class="block-type-badge">${type}</span>
            <span class="block-preview">${this.escapeHtml(preview)}</span>
            <button type="button" class="remove-context-btn" data-block-id="${block.getData().id}" title="Remove from context">×</button>
          </div>
        `
      }).join('')

      // Attach remove events
      this.contextList.querySelectorAll('.remove-context-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.blockId!
          this.removeFromContext(id)
        })
      })
    }
  }

  /**
   * Get preview text from block
   */
  private getBlockPreview(block: BaseBlock): string {
    const data = block.getData()
    let text = ''

    if (typeof data.content === 'string') {
      text = data.content
    } else if (Array.isArray(data.content)) {
      text = data.content.join(' ')
    }

    // Strip HTML tags
    text = text.replace(/<[^>]*>/g, '')

    // Limit length
    const maxLength = 60
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...'
    }

    return text || '(empty)'
  }

  /**
   * Send prompt to AI
   */
  private async sendPrompt(): Promise<void> {
    const prompt = this.promptTextarea.value.trim()

    if (!prompt) {
      this.showError('Please enter a prompt')
      return
    }

    // In edit mode, require at least one context block
    if (this.mode === 'edit' && this.contextBlocks.length === 0) {
      this.showError('Please add at least one block to context for editing')
      return
    }

    const additionalInstructions = this.additionalInstructionsTextarea.value.trim()

    this.setLoading(true)
    this.hideError()

    try {
      // Build request body
      const requestBody: any = {
        prompt: prompt,
        context_blocks: this.contextBlocks.map(b => b.toHTML()),
        mode: this.mode,
        additional_instructions: additionalInstructions
      }

      // Only include model if explicitly selected
      if (this.selectedModel) {
        requestBody.model = this.selectedModel
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken()
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        // Success! Insert or replace content
        if (this.mode === 'generate') {
          this.editor.insertAIContent(data.content)
        } else {
          this.editor.replaceBlocksWithAI(data.content, this.contextBlocks)
        }

        // Clear form
        this.clearForm()

        // Show success feedback (optional)
        this.showSuccess('Content generated successfully!')
      } else {
        this.showError(data.error || 'Unknown error occurred')
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Network error')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.generateBtn.disabled = loading

    const btnText = this.generateBtn.querySelector('.btn-text') as HTMLElement
    const btnLoading = this.generateBtn.querySelector('.btn-loading') as HTMLElement

    if (loading) {
      btnText.style.display = 'none'
      btnLoading.style.display = 'flex'
    } else {
      btnText.style.display = 'flex'
      btnLoading.style.display = 'none'
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorElement.textContent = message
    this.errorElement.style.display = 'block'
  }

  /**
   * Hide error message
   */
  private hideError(): void {
    this.errorElement.style.display = 'none'
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    // Create temporary success message
    const successEl = document.createElement('div')
    successEl.className = 'ai-success'
    successEl.textContent = message
    successEl.style.cssText = 'padding: 12px; background: #10b981; color: white; border-radius: 6px; margin-top: 12px;'

    this.errorElement.parentElement!.insertBefore(successEl, this.errorElement)

    // Remove after 3 seconds
    setTimeout(() => {
      successEl.remove()
    }, 3000)
  }

  /**
   * Clear form fields
   */
  private clearForm(): void {
    this.promptTextarea.value = ''
    this.additionalInstructionsTextarea.value = ''
    this.clearContext()
  }

  /**
   * Get CSRF token from cookie
   */
  private getCSRFToken(): string {
    const name = 'csrftoken'
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1)
      }
    }
    return ''
  }

  /**
   * Escape HTML for safe display
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Get the panel element
   */
  getElement(): HTMLElement {
    return this.panelElement
  }
}
