import {Prisma, PrismaClient} from '../../../generated/prisma';
import './env.js';

export const prisma = new PrismaClient();
export {Prisma};
