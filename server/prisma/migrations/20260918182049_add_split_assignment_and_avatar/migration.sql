-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assigneeDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "secondAssigneeDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "secondAssigneeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT NOT NULL DEFAULT '😊';

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_secondAssigneeId_fkey" FOREIGN KEY ("secondAssigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
