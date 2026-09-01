#!/usr/bin/env node
/**
 * 从 Supabase Storage 下载 match-images bucket 的全部图片到本地。
 *
 * 用途：Phase 0 备份。迁移前把所有图片抓下来，之后再传到腾讯云 COS。
 *
 * 用法（任选）：
 *   1. 环境变量方式：
 *      SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=<anon> \
 *        node scripts/download-images.mjs [输出目录]
 *   2. 交互式：直接 node scripts/download-images.mjs [输出目录]，脚本会提示输入。
 *
 * 输出目录默认 ./images-out，会打印文件总数与列表，便于迁移后对账。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const BUCKET = process.env.SUPABASE_BUCKET || 'match-images';

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve_) => rl.question(question, (a) => { rl.close(); resolve_(a.trim()); }));
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || (await prompt('Supabase 项目 URL（如 https://xxx.supabase.co）: ')).replace(/\/+$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || (await prompt('Supabase anon key: '));
  const outDir = resolve(process.argv[2] || './images-out');

  if (!supabaseUrl || !anonKey) {
    console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  // 1) 分页枚举所有对象
  console.log(`枚举 ${BUCKET} bucket 中的对象 ...`);
  const names = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const resp = await fetch(`${supabaseUrl}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!resp.ok) {
      throw new Error(`列出对象失败：HTTP ${resp.status} ${await resp.text()}`);
    }
    const page = await resp.json();
    const files = page.filter((o) => o.id && !o.name.endsWith('/'));
    names.push(...files.map((o) => o.name));
    if (page.length < limit) break;
    offset += limit;
  }

  console.log(`共发现 ${names.length} 个图片文件`);
  if (names.length === 0) {
    console.log('bucket 为空，无需下载。');
    return;
  }

  // 2) 逐个下载
  await mkdir(outDir, { recursive: true });
  let ok = 0;
  const failed = [];
  for (const name of names) {
    const resp = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURI(name)}`, { headers });
    if (!resp.ok) {
      failed.push(name);
      console.error(`  下载失败: ${name} (HTTP ${resp.status})`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    // 用 index 前缀避免重名/子路径冲突
    const safeName = name.split('/').pop();
    const filePath = resolve(outDir, `${String(ok).padStart(4, '0')}-${safeName}`);
    await writeFile(filePath, buf);
    ok += 1;
    if (ok % 50 === 0 || ok === names.length) console.log(`  已下载 ${ok}/${names.length}`);
  }

  console.log('\n下载完成：');
  console.log(`  成功 ${ok}，失败 ${failed.length}`);
  if (failed.length) {
    console.log('失败列表（可重跑，已下载的文件会被跳过前缀号覆盖）：');
    failed.forEach((n) => console.log('  ' + n));
  }
  console.log(`输出目录：${outDir}`);
  console.log('\n下一步：把这些文件上传到 COS 的 match-images/ 前缀下，再执行部署手册里的 SQL 改写 image_url。');
}

main().catch((e) => { console.error(e); process.exit(1); });
