'use server';

import COS from 'cos-nodejs-sdk-v5';
import sharp from 'sharp';
import { requireUser } from '@/lib/auth';
import { getThumbPath } from '@/lib/imageUtils';

let cos: COS | null = null;

function getCos(): COS {
  if (cos) return cos;
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;
  if (!SecretId || !SecretKey) {
    throw new Error('缺少 COS_SECRET_ID / COS_SECRET_KEY 环境变量');
  }
  cos = new COS({ SecretId, SecretKey });
  return cos;
}

/** 为 COS 对象生成带签名的临时访问 URL（有效期 24 小时） */
export async function getSignedUrl(key: string): Promise<string> {
  const bucket = process.env.COS_BUCKET!;
  const region = process.env.COS_REGION!;
  const url = getCos().getObjectUrl(
    {
      Bucket: bucket,
      Region: region,
      Key: key,
      Sign: true,
      Expires: 86400, // 24 小时
    },
    (err, data) => {
      if (err) console.error('生成签名 URL 失败:', err);
    }
  );
  return url;
}

/** 从完整 URL 中提取 COS 对象 Key */
export async function extractKeyFromUrl(url: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (base && url.startsWith(base + '/')) {
    return url.slice(base.length + 1);
  }
  // 兼容直接 COS 域名
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  const cosPrefix = `https://${bucket}.cos.${region}.myqcloud.com/`;
  if (url.startsWith(cosPrefix)) {
    return url.slice(cosPrefix.length);
  }
  return url;
}

// 缩略图长边上限，列表加载走这张小图；原图保持原样上传（点开看原图）
const THUMB_MAX_SIZE = 800;
const THUMB_QUALITY = 75;

function putObject(
  bucket: string,
  region: string,
  Key: string,
  Body: Buffer,
  ContentType: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    getCos().putObject({ Bucket: bucket, Region: region, Key, Body, ContentType }, (err) =>
      err ? reject(err) : resolve()
    );
  });
}

export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  await requireUser();

  const file = formData.get('file') as File | null;
  if (!file) {
    throw new Error('未找到上传文件');
  }

  const matchId = (formData.get('matchId') as string) || '';
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `match-images/${matchId}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) {
    throw new Error('缺少 COS_BUCKET / COS_REGION 环境变量');
  }

  await putObject(bucket, region, key, buffer, file.type || 'image/jpeg');

  // 顺带生成并上传缩略图（列表加载用）。失败只记日志：前端会回退到原图，不影响上传。
  try {
    const thumbBody = await sharp(buffer)
      .rotate()
      .resize({ width: THUMB_MAX_SIZE, height: THUMB_MAX_SIZE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();
    await putObject(bucket, region, getThumbPath(key), thumbBody, 'image/webp');
  } catch (err) {
    console.error('生成/上传缩略图失败（忽略，前端将回退到原图）:', err);
  }

  // 返回签名 URL，确保 COS 桶保持私有也能正常访问
  const signedUrl = await getSignedUrl(key);
  return { url: signedUrl };
}

export async function deleteCosObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) return;
  await new Promise<void>((resolve, reject) => {
    getCos().deleteMultipleObject(
      { Bucket: bucket, Region: region, Objects: keys.map((Key) => ({ Key })) },
      (err) => (err ? reject(err) : resolve())
    );
  });
}
