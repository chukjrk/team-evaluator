-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "targetCustomerCostOfInaction" TEXT,
ADD COLUMN     "targetCustomerWho" TEXT,
ADD COLUMN     "targetCustomerWorkaround" TEXT,
ALTER COLUMN "targetCustomer" DROP NOT NULL;
