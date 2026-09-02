'use server';

import sharp from 'sharp';
import { requireUser } from '@/lib/auth';
import { getThumbPath } from '@/lib/imageUtils';
import { getCosClient } from '@/lib/cos-image';

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
    getCosClient().putObject({ Bucket: bucket, Region: region, Key, Body, ContentType }, (err) =>
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

  // 入库只存对象 key（不带签名、不过期）；展示时由 listRecords 现场对原图与小图签名。
  // 缩略图不再在此同步生成（避免上传被 sharp CPU 拖慢），改由 generateThumb 单独调用。
  return { url: key };
}

/**
 * 上传原图后单独调用：从 COS 取回原图生成 .thumb.webp。
 * 设计为「上传后立即返回成功、缩略图后台生成」；失败只记日志，
 * 前端 listRecords / RecordImage 已有「缩略图缺失回退原图」的兜底，不影响展示。
 */
export async function generateThumb(key: string): Promise<void> {
  await requireUser();
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) {
    throw new Error('缺少 COS_BUCKET / COS_REGION 环境变量');
  }

  const cos = getCosClient();
  const origin = await new Promise<Buffer>((resolve, reject) => {
    cos.getObject({ Bucket: bucket, Region: region, Key: key }, (err, data) =>
      err ? reject(err) : resolve(data.Body as Buffer)
    );
  });

  const thumbBody = await sharp(origin)
    .rotate()
    .resize({ width: THUMB_MAX_SIZE, height: THUMB_MAX_SIZE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
  await putObject(bucket, region, getThumbPath(key), thumbBody, 'image/webp');
}
