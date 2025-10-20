import { prisma } from '@/lib/prisma';

export async function getPantryItems(userId: string) {
  return prisma.FoodItem.findMany({
    where: { userId },
    include: {
      foodItem: true,
    },
  });
}

// file stub for db interactions