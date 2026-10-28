import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_url" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_width" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_height" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_mime_type" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_filesize" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN "sizes_avatar_filename" varchar;
  CREATE INDEX "media_sizes_avatar_sizes_avatar_filename_idx" ON "payload"."media" USING btree ("sizes_avatar_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."media_sizes_avatar_sizes_avatar_filename_idx";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_url";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_width";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_height";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_mime_type";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_filesize";
  ALTER TABLE "payload"."media" DROP COLUMN "sizes_avatar_filename";`)
}
