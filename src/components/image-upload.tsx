'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  previewSize?: 'sm' | 'md' | 'lg';
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  previewSize = 'md'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-40 h-40',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };
  
  const textSizeClasses = {
    sm: 'h-6 w-6 mb-1',
    md: 'h-8 w-8 mb-2',
    lg: 'h-10 w-10 mb-2'
  };
  
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm'
  };
  
  const sizeClass = sizeClasses[previewSize];
  const iconSize = textSizeClasses[previewSize];
  const textSize = textClasses[previewSize];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, GIF, or WebP).'
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 5MB.'
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
      
      toast({
        title: 'Image uploaded',
        description: 'Your image has been successfully uploaded.'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image.'
      });
      setPreview(value);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <div className={cn('relative rounded-lg overflow-hidden border', sizeClass)}>
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-cover"
            />
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors px-2 text-center',
            sizeClass,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className={cn('text-muted-foreground animate-spin', iconSize)} />
              <p className={cn('text-muted-foreground', textSize)}>Uploading...</p>
            </>
          ) : (
            <>
              <Upload className={cn('text-muted-foreground', iconSize)} />
              <p className={cn('text-muted-foreground', textSize)}>Click to upload</p>
              <p className={cn('text-muted-foreground', previewSize === 'sm' ? 'text-[10px] mt-0.5' : 'text-xs mt-1')}>
                {previewSize === 'sm' ? 'Max 5MB' : 'PNG, JPG, GIF or WebP (max 5MB)'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
