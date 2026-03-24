/**
 * 获取优化后的 Supabase 图片 URL
 * 添加查询参数以启用 CDN 缓存和优化
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width: number = 800,
  quality: number = 75
): string {
  if (!originalUrl || !originalUrl.includes('supabase.co/storage/v1/object/public/')) {
    return originalUrl;
  }

  // Supabase 支持通过查询参数优化图片
  // 添加 width 和 quality 参数
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}width=${width}&quality=${quality}`;
}

/**
 * 生成模糊占位图的 base64
 */
export function getBlurPlaceholder(): string {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==';
}
