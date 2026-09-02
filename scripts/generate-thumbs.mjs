#!/usr/bin/env node
/**
 * 为 COS 上已存在的图片补生成 .thumb.webp 缩略图（列表加载用的小图）。
 *
 * 新上传的图片 uploadImage 已自动生成小图；本脚本用于给迁移前的"老图"补一次，
 * 幂等可重复跑：已存在 .thumb.webp 的对象会跳过。
 *
 * 用法：先设置 COS 环境变量（在服务器上可 source .env.production）：
 *   COS_SECRET_ID=... COS_SECRET_KEY=... COS_BUCKET=... COS_REGION=... \
 *     node scripts/generate-thumbs.mjs
 * 或
 *   set -a; source .env.production; set +a; node scripts/generate-thumbs.mjs
 */
import COS from 'cos-nodejs-sdk-v5';
import sharp from 'sharp';

const SecretId = process.env.COS_SECRET_ID;
const SecretKey = process.env.COS_SECRET_KEY;
const Bucket = process.env.COS_BUCKET;
const Region = process.env.COS_REGION;

if (!SecretId || !SecretKey || !Bucket || !Region) {
  console.error('错误：缺少 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION');
  console.error('提示：在服务器上先执行  set -a; source .env.production; set +a  再运行本脚本。');
  process.exit(1);
}

const PREFIX = 'match-images/';
const MAX_SIZE = 800;
const QUALITY = 75;

const cos = new COS({ SecretId, SecretKey });

const toThumbKey = (key) => {
  if (!key || key.endsWith('.thumb.webp')) return key;
  const slash = key.lastIndexOf('/');
  const base = slash === -1 ? '' : key.slice(0, slash + 1);
  const name = slash === -1 ? key : key.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  return `${base}${stem}.thumb.webp`;
};

function listAll(prefix) {
  return new Promise((resolve, reject) => {
    const keys = [];
    const page = (token) => {
      cos.listObjectsV2(
        { Bucket, Region, Prefix: prefix, ContinuationToken: token },
        (err, data) => {
          if (err) return reject(err);
          for (const o of data.Contents || []) if (o.Key && !o.Key.endsWith('/')) keys.push(o.Key);
          if (data.IsTruncated) return page(data.NextContinuationToken);
          resolve(keys);
        }
      );
    };
    page(undefined);
  });
}

function getObject(Key) {
  return new Promise((resolve, reject) =>
    cos.getObject({ Bucket, Region, Key }, (err, data) =>
      err ? reject(err) : resolve(Buffer.from(data.Body))
    )
  );
}

function putObject(Key, Body, ContentType) {
  return new Promise((resolve, reject) =>
    cos.putObject({ Bucket, Region, Key, Body, ContentType }, (err) =>
      err ? reject(err) : resolve()
    )
  );
}

async function main() {
  console.log(`枚举 ${Bucket}/${PREFIX} 下的对象 ...`);
  const keys = await listAll(PREFIX);
  const images = keys.filter((k) => !k.endsWith('.thumb.webp'));
  const keySet = new Set(keys);
  const todo = images.filter((k) => !keySet.has(toThumbKey(k)));

  console.log(`共 ${keys.length} 个对象，其中原图 ${images.length} 个，需要补小图 ${todo.length} 个。`);
  if (todo.length === 0) {
    console.log('没有需要处理的图片。');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const key of todo) {
    const thumbKey = toThumbKey(key);
    try {
      const buf = await getObject(key);
      const thumb = await sharp(buf)
        .rotate()
        .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      await putObject(thumbKey, thumb, 'image/webp');
      ok += 1;
    } catch (err) {
      fail += 1;
      console.error(`  失败: ${key} → ${thumbKey} (${err.message})`);
    }
    if ((ok + fail) % 50 === 0) {
      console.log(`  进度 ${ok + fail}/${todo.length}（成功 ${ok}，失败 ${fail}）`);
    }
  }
  console.log(`\n完成：成功 ${ok}，失败 ${fail}，共 ${todo.length} 个。`);
  if (fail > 0) console.log('有失败的图片，可修复问题后重跑（已生成的会自动跳过）。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
