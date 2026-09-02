/**
 * 返回图片 URL。
 * 图片缩放由 next/image 优化器自动处理，这里直接透传原始地址
 * （兼容 COS / CDN 域名上的图片，包括签名 URL）。
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  _width: number = 800,
  _quality: number = 75
): string {
  // 签名 URL 已包含查询参数，直接透传
  return originalUrl;
}

/**
 * 生成模糊占位图的 base64
 */
export function getBlurPlaceholder(): string {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==';
}
