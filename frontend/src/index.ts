import { BlockEditor } from './editor/block-editor';
import { EditorConfig } from './types';
import './styles/blocks.css';
import './styles/ai-assistant.css';

/**
 * Initialize all block editors on the page
 */
function initializeEditors(): void {
  const containers = document.querySelectorAll('.visual-editor-container');

  containers.forEach((container) => {
    const configData = container.getAttribute('data-editor-config');
    if (!configData) return;

    const config: EditorConfig = JSON.parse(configData);

    // Parse AI config if present
    const aiConfigData = container.getAttribute('data-ai-config');
    if (aiConfigData && aiConfigData !== 'null') {
      try {
        config.ai = JSON.parse(aiConfigData);
      } catch (error) {
        console.warn('Failed to parse AI config:', error);
      }
    }

    // Set global upload URL from config
    if (config.uploadUrl) {
      (window as any).DJANGO_VISUAL_EDITOR_UPLOAD_URL = config.uploadUrl;
    }

    // Find elements
    const editorElement = container.querySelector('.visual-editor-content') as HTMLElement;
    const textareaElement = container.querySelector('textarea') as HTMLTextAreaElement;

    if (!editorElement || !textareaElement) {
      console.error('Missing required editor elements');
      return;
    }

    // Create unique IDs if not present
    if (!editorElement.id) {
      editorElement.id = `editor-${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!textareaElement.id) {
      textareaElement.id = `textarea-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Initialize block editor (toolbar is now contextual and created automatically)
    try {
      new BlockEditor(
        editorElement.id,
        textareaElement.id,
        config
      );
    } catch (error) {
      console.error('Failed to initialize editor:', error);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEditors);
} else {
  initializeEditors();
}

// Export for manual initialization if needed
export { BlockEditor, EditorConfig };
