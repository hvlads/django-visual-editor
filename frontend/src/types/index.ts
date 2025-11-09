export interface EditorConfig {
  uploadUrl: string;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
}

export interface ToolbarButton {
  name: string;
  icon: string;
  title: string;
  command: string;
  value?: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  id?: number;
  error?: string;
}

export type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertOrderedList'
  | 'insertUnorderedList'
  | 'formatBlock'
  | 'createLink'
  | 'removeFormat';
