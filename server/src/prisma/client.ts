import { PrismaClient } from '@prisma/client';

// Prisma 7 uses config from prisma.config.ts for datasource
const prisma = new PrismaClient();

export default prisma;
