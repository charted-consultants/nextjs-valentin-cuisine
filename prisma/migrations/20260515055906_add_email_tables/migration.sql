/*
  Warnings:

  - You are about to drop the `submissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."submissions";

-- CreateTable
CREATE TABLE "public"."waiting_list_signups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "location" TEXT,
    "wants_to_try" TEXT,
    "opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waiting_list_signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_campaigns" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);
