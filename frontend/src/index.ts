import { VisualEditor } from './editor/visual-editor';
import { EditorConfig } from './types';
import './styles/editor.css';

/**
 * Initialize all visual editors on the page
 */
function initializeEditors(): void {
  const containers = document.querySelectorAll('.visual-editor-container');

  containers.forEach((container) => {
    const configData = container.getAttribute('data-editor-config');
    if (!configData) return;

    const config: EditorConfig = JSON.parse(configData);

    // Find elements
    const editorElement = container.querySelector('.visual-editor-content') as HTMLElement;
    const textareaElement = container.querySelector('textarea') as HTMLTextAreaElement;
    const toolbarElement = container.querySelector('.visual-editor-toolbar') as HTMLElement;

    if (!editorElement || !textareaElement || !toolbarElement) {
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
    if (!toolbarElement.id) {
      toolbarElement.id = `toolbar-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Initialize editor
    try {
      new VisualEditor(
        editorElement.id,
        textareaElement.id,
        toolbarElement.id,
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
export { VisualEditor, EditorConfig };
