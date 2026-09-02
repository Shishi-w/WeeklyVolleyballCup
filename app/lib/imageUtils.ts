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
 * 把对象路径/URL 映射到同目录的 .thumb.webp 缩略图。
 * 上传时已用 sharp 生成同名 .thumb.webp，列表加载走小图、点开仍看原图。
 * 已是缩略图则原样返回（幂等）。
 */
export function getThumbPath(path: string): string {
  if (!path) return path;
  if (path.endsWith('.thumb.webp')) return path;
  const slash = path.lastIndexOf('/');
  const base = slash === -1 ? '' : path.slice(0, slash + 1);
  const name = slash === -1 ? path : path.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  return `${base}${stem}.thumb.webp`;
}

/** 展示用缩略图 URL（由原图 URL 推导） */
export function getThumbUrl(url: string): string {
  return getThumbPath(url);
}

/**
 * 生成模糊占位图的 base64
 */
export function getBlurPlaceholder(): string {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==';
}
