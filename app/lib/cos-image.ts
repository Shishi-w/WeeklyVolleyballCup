import COS from 'cos-nodejs-sdk-v5';

let cos: COS | null = null;

export function getCosClient(): COS {
  if (cos) return cos;
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;
  if (!SecretId || !SecretKey) {
    throw new Error('缺少 COS_SECRET_ID / COS_SECRET_KEY 环境变量');
  }
  cos = new COS({ SecretId, SecretKey });
  return cos;
}

/** 当前 COS 桶默认域名 http(s)://bucket.cos.region.myqcloud.com；缺环境变量返回空串 */
export function cosOrigin(): string {
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  return bucket && region ? `https://${bucket}.cos.${region}.myqcloud.com` : '';
}

/** 为 COS 对象生成带签名的临时访问 URL（有效期 24 小时）。
 * 注意：SDK 返回的 URL 在回调 data.Url 里，不能取 getObjectUrl 的同步返回值。 */
export function getSignedUrl(key: string): Promise<string> {
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) {
    return Promise.reject(new Error('缺少 COS_BUCKET / COS_REGION 环境变量'));
  }
  return new Promise<string>((resolve, reject) => {
    getCosClient().getObjectUrl(
      { Bucket: bucket, Region: region, Key: key, Sign: true, Expires: 86400 },
      (err, data) => {
        if (err) {
          console.error('生成签名 URL 失败:', err);
          reject(err);
          return;
        }
        resolve((data as { Url: string }).Url);
      }
    );
  });
}

/**
 * 把数据库里存的图片字段解析成 COS 对象 key（不带签名）。
 * 兼容：裸 key（match-images/x.jpg）、公开 URL、签名 URL（自动去掉 ?query）、
 * NEXT_PUBLIC_IMAGE_BASE_URL（可能是 CDN）前缀。
 * 不是本桶 COS 对象的地址（如历史 Supabase URL）返回 null。
 */
export function extractKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let s = url.trim();
  const q = s.search(/[?#]/);
  if (q !== -1) s = s.slice(0, q);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return s; // 已经是裸 key
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (base && s.startsWith(base + '/')) return s.slice(base.length + 1);
  const origin = cosOrigin();
  if (origin && s.startsWith(origin + '/')) return s.slice(origin.length + 1);
  return null;
}

/** 批量删除 COS 对象（原图 + 缩略图等） */
export async function deleteCosObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) return;
  await new Promise<void>((resolve, reject) => {
    getCosClient().deleteMultipleObject(
      { Bucket: bucket, Region: region, Objects: keys.map((Key) => ({ Key })) },
      (err) => (err ? reject(err) : resolve())
    );
  });
}
