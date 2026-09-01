'use server';

import COS from 'cos-nodejs-sdk-v5';
import { requireUser } from '@/lib/auth';

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

  await new Promise<void>((resolve, reject) => {
    getCos().putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      },
      (err) => (err ? reject(err) : resolve())
    );
  });

  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || `https://${bucket}.cos.${region}.myqcloud.com`;
  return { url: `${base}/${key}` };
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
