'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getSignedUrl, extractKeyFromUrl, deleteCosObjects } from '@/lib/cos-image';
import { getThumbPath } from '@/lib/imageUtils';

export async function listRecords(matchId: string) {
  const { rows } = await db.query(
    'SELECT * FROM match_records WHERE match_id = $1 ORDER BY created_at DESC',
    [matchId]
  );
  // 库里存的是对象 key（老数据可能是完整 URL），这里解析出 key 后现场签名：
  // image_url = 签名原图（点开看原图），thumb_url = 签名小图（列表加载）。
  return Promise.all(
    rows.map(async (row: Record<string, unknown>) => {
      const stored = row.image_url as string;
      const key = extractKeyFromUrl(stored);
      if (!key) return row; // 非本桶 COS 对象（历史 Supabase 等）原样透传

      let image_url = stored; // 签名失败时回退到原存值，公开桶仍可显示
      try {
        image_url = await getSignedUrl(key);
      } catch (err) {
        console.error('生成图片签名 URL 失败（回退原值）:', err);
      }
      let thumb_url: string | null = null;
      try {
        thumb_url = await getSignedUrl(getThumbPath(key));
      } catch (err) {
        console.error('生成缩略图签名 URL 失败（忽略，前端回退原图）:', err);
      }
      return { ...row, image_url, thumb_url };
    })
  );
}

export async function createRecord(input: {
  match_id: string;
  image_url: string;
  caption: string;
}): Promise<void> {
  const user = await requireUser();
  await db.query(
    `INSERT INTO match_records (match_id, image_url, caption, edited_by, edited_by_username)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.match_id, input.image_url, input.caption ?? '', user.email || 'Anonymous', user.username || '匿名用户']
  );
}

export async function deleteRecord(id: string): Promise<void> {
  await requireUser();
  const { rows } = await db.query('SELECT image_url FROM match_records WHERE id = $1', [id]);
  await db.query('DELETE FROM match_records WHERE id = $1', [id]);
  // 同步删除 COS 上的原图与缩略图，失败只记日志
  const key = extractKeyFromUrl(rows[0]?.image_url as string | undefined);
  if (key) {
    await deleteCosObjects([key, getThumbPath(key)]).catch((err) =>
      console.error('删除 COS 图片失败（忽略）:', err)
    );
  }
}

export async function updateCaption(id: string, caption: string): Promise<void> {
  const user = await requireUser();
  await db.query(
    `UPDATE match_records
     SET caption = $1, edited_by = $2, edited_by_username = $3, updated_at = now()
     WHERE id = $4`,
    [caption, user.email || 'Anonymous', user.username || '匿名用户', id]
  );
}

export async function addComment(recordId: string, comment: string): Promise<void> {
  const user = await requireUser();
  const { rows } = await db.query(
    'SELECT comments FROM match_records WHERE id = $1',
    [recordId]
  );
  const current = rows[0]?.comments ?? [];
  const next = [...current, comment];
  await db.query(
    'UPDATE match_records SET comments = $1::jsonb, updated_at = now() WHERE id = $2',
    [JSON.stringify(next), recordId]
  );
}
