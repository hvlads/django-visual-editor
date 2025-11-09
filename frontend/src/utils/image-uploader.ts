import { UploadResponse } from '../types';

/**
 * Handles image uploads to the server
 */
export class ImageUploader {
  private uploadUrl: string;

  constructor(uploadUrl: string) {
    this.uploadUrl = uploadUrl;
  }

  /**
   * Upload an image file to the server
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    // Get CSRF token from cookie
    const csrfToken = this.getCsrfToken();

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get CSRF token from cookie
   */
  private getCsrfToken(): string {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }

    return '';
  }

  /**
   * Validate image file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 5MB.',
      };
    }

    return { valid: true };
  }
}
