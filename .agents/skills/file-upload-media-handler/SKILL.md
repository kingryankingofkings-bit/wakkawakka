---
name: file-upload-media-handler
description: Use when implementing file upload functionality, image processing, media storage, or handling user-generated content like images, videos, documents. Triggers on requests like "file upload", "image upload", "profile picture", "document upload", "S3 storage", "Cloudinary", "file handling", "media library", or when any user file submission is needed. Provides secure upload patterns with validation, virus scanning considerations, and CDN integration.
---

# File Upload and Media Handler

## Goal
Implement secure, performant file uploads with proper validation, storage, and delivery.

## Do Not Use When
- No file uploads needed
- Using a third-party upload service exclusively (UploadThing, etc.)

## Required Inputs To Inspect
- File types allowed
- Size limits
- Storage solution (S3, Cloudflare R2, local, etc.)
- CDN integration
- Image processing needs (resize, optimize)

## Workflow

1. **Validate on client**: File type, size before upload
2. **Validate on server**: Never trust client validation
3. **Generate presigned URL**: For direct-to-S3 uploads
4. **Process images**: Resize, optimize, generate variants
5. **Store metadata**: URL, size, type, dimensions in database
6. **Serve via CDN**: Use CDN URL, not direct storage URL
7. **Clean up**: Delete from storage when record is deleted

## Security Checklist
- [ ] File type validated (extension + mime type + magic bytes)
- [ ] File size limited
- [ ] Filename sanitized (no path traversal)
- [ ] Storage bucket is private, CDN is public
- [ ] Presigned URLs expire quickly (15 min)
- [ ] Virus scanning for document uploads (if required)
- [ ] No executable files allowed

## Upload Pattern

```
Client → Request upload URL → Server generates presigned URL → Client uploads directly to S3 → Client confirms → Server saves metadata
```

## Quality Checks
- [ ] Upload progress shown to user
- [ ] Errors handled gracefully
- [ ] Images optimized for web
- [ ] CDN serves files with proper caching
- [ ] Cleanup on deletion

## Coordinates With
- `backend-api-architect` — for upload endpoints
- `third-party-api-integration` — for S3/Cloudinary
