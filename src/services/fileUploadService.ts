import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const fileUploadService = {
  /**
   * Upload image to chat-images bucket
   */
  async uploadChatImage(file: File, sessionId: string): Promise<UploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${sessionId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return {
        publicUrl: data.publicUrl,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type
      };
    } catch (error) {
      console.error('Error uploading chat image:', error);
      throw error;
    }
  },

  /**
   * Delete uploaded file
   */
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('chat-images')
        .remove([fileName]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  /**
   * Get file URL
   */
  getFileUrl(fileName: string): string {
    const { data } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  },

  /**
   * Validate image file
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Only image files are allowed' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }

    // Check allowed formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Allowed formats: JPEG, PNG, GIF, WebP' };
    }

    return { isValid: true };
  }
};