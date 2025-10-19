-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fdcId" INTEGER,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFoodItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "estimatedExpirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_shortName_key" ON "Unit"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_fdcId_key" ON "FoodItem"("fdcId");

-- CreateIndex
CREATE INDEX "FoodItem_category_idx" ON "FoodItem"("category");

-- CreateIndex
CREATE INDEX "FoodItem_fdcId_idx" ON "FoodItem"("fdcId");

-- CreateIndex
CREATE INDEX "UserFoodItem_userId_idx" ON "UserFoodItem"("userId");

-- CreateIndex
CREATE INDEX "UserFoodItem_foodItemId_idx" ON "UserFoodItem"("foodItemId");

-- CreateIndex
CREATE INDEX "UserFoodItem_estimatedExpirationDate_idx" ON "UserFoodItem"("estimatedExpirationDate");

-- AddForeignKey
ALTER TABLE "UserFoodItem" ADD CONSTRAINT "UserFoodItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodItem" ADD CONSTRAINT "UserFoodItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodItem" ADD CONSTRAINT "UserFoodItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
