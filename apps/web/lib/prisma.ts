import {PrismaClient} from '../../../generated/prisma'
import {config} from 'dotenv'
import path from 'path'

// Load .env from monorepo root
config({path: path.resolve(process.cwd(), '../../.env')})

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma