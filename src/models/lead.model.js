import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateLeadStatus(leadId, status) {
  return prisma.lead.update({
    where: { id: leadId },
    data: { 
      status,
      ...(status === 'CONTACTED' && { firstContactAt: new Date() }),
      lastContactAt: new Date()
    }
  });
}