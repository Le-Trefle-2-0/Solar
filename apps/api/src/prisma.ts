// ESM/CJS interop for Prisma in Node ESM (avoids named export issue)
import prismaPkg from '@prisma/client';

const {PrismaClient} = prismaPkg as typeof import('@prisma/client');

// Create a single PrismaClient instance
export const prisma = new PrismaClient();
