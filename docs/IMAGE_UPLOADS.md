# Image Upload Feature

## Overview
The application now supports uploading and storing images locally. Images are stored in the `public/uploads` directory and served statically.

## How It Works

### Upload Flow
1. User selects an image using the `ImageUpload` component
2. Image is validated (type and size)
3. Image is uploaded to `/api/upload` endpoint
4. Server saves the file to `public/uploads` with a unique filename
5. Image URL path is returned and stored in the database

### Components

#### ImageUpload Component
Location: `src/components/image-upload.tsx`

A reusable component for uploading images with:
- Drag-and-drop interface
- Image preview
- File validation (type and size)
- Upload progress indicator
- Remove functionality

Usage:
```tsx
import { ImageUpload } from '@/components/image-upload';

const [imageUrl, setImageUrl] = useState('');

<ImageUpload 
  value={imageUrl}
  onChange={setImageUrl}
  disabled={false}
/>
```

#### Upload API
Location: `src/app/api/upload/route.ts`

- **Method**: POST
- **Content-Type**: multipart/form-data
- **Authentication**: Required (NextAuth session)
- **Max File Size**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, GIF, WebP

Response:
```json
{
  "success": true,
  "url": "/uploads/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg"
}
```

### File Storage

#### Directory Structure
```
public/
  uploads/
    .gitkeep          # Ensures directory exists in git
    [uploaded files]  # Actual files are gitignored
```

#### Filename Format
`{timestamp}-{random-string}{extension}`

Example: `1698765432100-a7b9c3d4e5f6.jpg`

### Security Considerations

1. **File Type Validation**: Only image files are accepted
2. **File Size Limit**: Maximum 5MB per file
3. **Authentication**: Users must be logged in to upload
4. **Unique Filenames**: Prevents overwriting existing files
5. **Directory Isolation**: Files are stored in a dedicated uploads directory

### Production Deployment

For production, consider using a cloud storage service:
- **AWS S3**: Scalable, reliable
- **Cloudinary**: Built-in image optimization
- **Vercel Blob Storage**: Seamless Vercel integration
- **Azure Blob Storage**: Microsoft cloud option

To migrate to cloud storage:
1. Update `/api/upload` route to use cloud SDK
2. Update image URLs to use cloud CDN
3. Remove local file system writes

### Maintenance

#### Cleanup
Uploaded files are not automatically deleted. Consider implementing:
- Periodic cleanup of unused images
- Image reference tracking in database
- Storage quota monitoring

#### Backup
Include `public/uploads` directory in your backup strategy if using local storage.

### Limitations

- Local storage is not suitable for high-scale production
- Files are not automatically synced across multiple server instances
- No built-in CDN or optimization
- Uploaded files persist after database records are deleted

### Future Enhancements

- [ ] Image compression and optimization
- [ ] Multiple image upload
- [ ] Image cropping/editing
- [ ] Cloud storage integration
- [ ] Automatic thumbnail generation
- [ ] Image usage tracking and cleanup
