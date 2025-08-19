-- Fix user_id column type from UUID to TEXT
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_users_id_fk";
ALTER TABLE "chats" ALTER COLUMN "user_id" TYPE text;
ALTER TABLE "users" ALTER COLUMN "id" TYPE text;
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
