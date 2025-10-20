import { PrismaClient } from '../generated/prisma'
export const prisma = new PrismaClient()

export async function getPantryItems(userId: string) {
  return prisma.FoodItem.findMany({
    where: { userId },
    include: {
      foodItem: true,
    },
  });
}

// file stub for db interactions