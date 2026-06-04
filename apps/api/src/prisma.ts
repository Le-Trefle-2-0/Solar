import {Prisma, PrismaClient} from '../../../generated/prisma/index.js';
import './env.js';

export const prisma = new PrismaClient();
export {Prisma};
