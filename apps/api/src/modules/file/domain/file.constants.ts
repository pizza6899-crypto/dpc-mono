export const FileConstants = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        IMAGE_OPTIMIZABLE: ['image/jpeg', 'image/png', 'image/webp'],
        DOCS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    }
} as const;
