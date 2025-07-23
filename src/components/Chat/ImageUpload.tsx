import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fileUploadService } from '@/services/fileUploadService';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, fileName: string) => void;
  sessionId: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, sessionId, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const validateAndUploadFile = async (file: File) => {
    // Validate file
    const validation = fileUploadService.validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Upload file
      const result = await fileUploadService.uploadChatImage(file, sessionId);
      
      // Clear preview
      setPreviewImage(null);
      URL.revokeObjectURL(previewUrl);
      
      // Notify parent component
      onImageUpload(result.publicUrl, result.fileName);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      
      // Clear preview on error
      if (previewImage) {
        setPreviewImage(null);
        URL.revokeObjectURL(previewImage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndUploadFile(file);
    }
    // Reset input value to allow same file selection
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndUploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const clearPreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  return (
    <>
      {/* Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleFileSelect}
        disabled={disabled || uploading}
        className="p-2"
        title="Upload Image"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Preview Image */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-2 left-0 right-0"
          >
            <Card className="mx-4 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {uploading ? 'Uploading image...' : 'Image ready to send'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uploading ? 'Please wait' : 'Will be sent with your message'}
                    </p>
                  </div>
                  
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearPreview}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Card className="m-8 max-w-md">
              <CardContent className="p-8 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Drop image here</h3>
                <p className="text-gray-600">Release to upload your image</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageUpload;