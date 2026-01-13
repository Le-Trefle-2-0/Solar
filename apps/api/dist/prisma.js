// ESM/CJS interop for Prisma in Node ESM (avoids named export issue)
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
// Create a single PrismaClient instance
export const prisma = new PrismaClient();
