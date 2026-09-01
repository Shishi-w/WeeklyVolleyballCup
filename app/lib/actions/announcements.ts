'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { Announcement } from '@/lib/types';

export async function listAnnouncements() {
  const { rows } = await db.query('SELECT * FROM announcements ORDER BY created_at ASC');
  return rows as Announcement[];
}

type AnnouncementInput = Pick<
  Announcement,
  'title' | 'content' | 'color' | 'pattern' | 'rotation' | 'position_x' | 'position_y'
>;

export async function createAnnouncement(input: AnnouncementInput): Promise<void> {
  const user = await requireUser();
  await db.query(
    `INSERT INTO announcements (title, content, position_x, position_y, rotation, color, pattern, edited_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.title,
      input.content,
      input.position_x ?? 0,
      input.position_y ?? 0,
      input.rotation ?? 0,
      input.color ?? 'white',
      input.pattern ?? 'none',
      user.username || user.email || 'Anonymous',
    ]
  );
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput
): Promise<void> {
  const user = await requireUser();
  await db.query(
    `UPDATE announcements
     SET title = $1, content = $2, position_x = $3, position_y = $4,
         rotation = $5, color = $6, pattern = $7, edited_by = $8, updated_at = now()
     WHERE id = $9`,
    [
      input.title,
      input.content,
      input.position_x ?? 0,
      input.position_y ?? 0,
      input.rotation ?? 0,
      input.color ?? 'white',
      input.pattern ?? 'none',
      user.username || user.email || 'Anonymous',
      id,
    ]
  );
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireUser();
  await db.query('DELETE FROM announcements WHERE id = $1', [id]);
}
