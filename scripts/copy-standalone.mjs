// next build 生成 standalone 产物后，把 public 和 .next/static 拷进 standalone，
// 否则生产环境静态资源（CSS/JS/图片/字体）全部 404。
// 对应 DEPLOY.md 阶段 E1 原本需要手动执行的 cp 步骤，现在构建后自动完成。
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const standaloneDir = '.next/standalone';
if (!existsSync(standaloneDir)) {
  console.error('.next/standalone 不存在，跳过复制（可能不是 standalone 构建）');
  process.exit(0);
}

const copyDir = (src, dest) => {
  if (!existsSync(src)) {
    console.error(`跳过：${src} 不存在`);
    return;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`已复制 ${src} → ${dest}`);
};

copyDir('public', `${standaloneDir}/public`);
copyDir('.next/static', `${standaloneDir}/.next/static`);
