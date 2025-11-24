/**
 * WhatsApp Media Service
 *
 * Handles media validation, upload, and preview for WhatsApp messages
 */

/**
 * Supported media types for WhatsApp
 */
export const MEDIA_TYPES = {
  IMAGE: {
    name: 'Image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5 MB
    extensions: ['.jpg', '.jpeg', '.png', '.webp']
  },
  VIDEO: {
    name: 'Video',
    mimeTypes: ['video/mp4', 'video/3gpp'],
    maxSize: 16 * 1024 * 1024, // 16 MB
    extensions: ['.mp4', '.3gp']
  },
  AUDIO: {
    name: 'Audio',
    mimeTypes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
    maxSize: 16 * 1024 * 1024, // 16 MB
    extensions: ['.aac', '.m4a', '.mp3', '.amr', '.ogg', '.opus']
  },
  DOCUMENT: {
    name: 'Document',
    mimeTypes: [
      'text/plain',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 100 * 1024 * 1024, // 100 MB
    extensions: ['.txt', '.pdf', '.ppt', '.doc', '.xls', '.docx', '.pptx', '.xlsx']
  }
};

/**
 * Get media type from MIME type
 */
export const getMediaTypeFromMime = (mimeType) => {
  for (const [key, type] of Object.entries(MEDIA_TYPES)) {
    if (type.mimeTypes.includes(mimeType)) {
      return key.toLowerCase();
    }
  }
  return null;
};

/**
 * Get media type from file extension
 */
export const getMediaTypeFromExtension = (filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  for (const [key, type] of Object.entries(MEDIA_TYPES)) {
    if (type.extensions.includes(ext)) {
      return key.toLowerCase();
    }
  }
  return null;
};

/**
 * Validate media type
 */
export const validateMediaType = (file) => {
  const mediaType = getMediaTypeFromMime(file.type);

  if (!mediaType) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: images, videos, audio, and documents.`
    };
  }

  return {
    valid: true,
    mediaType: mediaType,
    typeName: MEDIA_TYPES[mediaType.toUpperCase()].name
  };
};

/**
 * Validate media size
 */
export const validateMediaSize = (file) => {
  const mediaType = getMediaTypeFromMime(file.type);

  if (!mediaType) {
    return {
      valid: false,
      error: 'Cannot validate size for unsupported file type'
    };
  }

  const maxSize = MEDIA_TYPES[mediaType.toUpperCase()].maxSize;

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB) for ${MEDIA_TYPES[mediaType.toUpperCase()].name.toLowerCase()}s`
    };
  }

  return {
    valid: true,
    size: file.size,
    maxSize: maxSize
  };
};

/**
 * Validate media file (type and size)
 */
export const validateMedia = (file) => {
  // Validate type
  const typeValidation = validateMediaType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate size
  const sizeValidation = validateMediaSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return {
    valid: true,
    mediaType: typeValidation.mediaType,
    typeName: typeValidation.typeName,
    size: sizeValidation.size,
    maxSize: sizeValidation.maxSize
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate preview for media file
 */
export const generatePreview = (file) => {
  return new Promise((resolve, reject) => {
    const mediaType = getMediaTypeFromMime(file.type);

    if (!mediaType) {
      reject(new Error('Unsupported file type'));
      return;
    }

    if (mediaType === 'image') {
      // Generate image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: 'image',
          url: e.target.result,
          name: file.name,
          size: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else if (mediaType === 'video') {
      // Generate video preview
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: 'video',
          url: e.target.result,
          name: file.name,
          size: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else if (mediaType === 'audio') {
      // Audio file - no visual preview
      resolve({
        type: 'audio',
        url: null,
        name: file.name,
        size: file.size
      });
    } else if (mediaType === 'document') {
      // Document file - no visual preview
      resolve({
        type: 'document',
        url: null,
        name: file.name,
        size: file.size
      });
    }
  });
};

/**
 * Get icon for media type
 */
export const getMediaIcon = (mediaType) => {
  const icons = {
    image: 'image',
    video: 'videocam',
    audio: 'audiotrack',
    document: 'description'
  };
  return icons[mediaType] || 'attachment';
};

/**
 * Get color for media type
 */
export const getMediaColor = (mediaType) => {
  const colors = {
    image: '#4CAF50',
    video: '#2196F3',
    audio: '#9C27B0',
    document: '#FF9800'
  };
  return colors[mediaType] || '#757575';
};

/**
 * Check if media type supports preview
 */
export const supportsPreview = (mediaType) => {
  return ['image', 'video'].includes(mediaType);
};

/**
 * Extract media metadata
 */
export const extractMediaMetadata = (file) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    mediaType: getMediaTypeFromMime(file.type),
    extension: file.name.substring(file.name.lastIndexOf('.')),
    lastModified: file.lastModified ? new Date(file.lastModified) : null
  };
};

/**
 * Create media upload payload
 */
export const createUploadPayload = (file, caption = '') => {
  const metadata = extractMediaMetadata(file);

  return {
    file: file,
    caption: caption,
    metadata: {
      filename: metadata.name,
      size: metadata.size,
      mime_type: metadata.type,
      media_type: metadata.mediaType,
      extension: metadata.extension
    }
  };
};

/**
 * Parse media URL from message
 */
export const parseMediaUrl = (message) => {
  const metadata = message.metadata || {};
  return {
    hasMedia: !!metadata.media_url,
    mediaUrl: metadata.media_url || null,
    mediaType: metadata.media_type || null,
    caption: metadata.caption || '',
    filename: metadata.filename || null,
    size: metadata.size || null
  };
};
