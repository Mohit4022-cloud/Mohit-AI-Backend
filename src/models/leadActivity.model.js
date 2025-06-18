import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createLeadActivity(activityData) {
  return prisma.activity.create({
    data: activityData
  });
}