/*
  Warnings:

  - You are about to drop the column `auth_provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `provider_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "users_auth_provider_provider_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth_provider",
DROP COLUMN "provider_id",
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "password_hash" SET NOT NULL;

-- DropEnum
DROP TYPE "AuthProvider";

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
