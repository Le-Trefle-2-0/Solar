import { PrismaClient } from "@prisma/client";

declare global {
  namespace NodeJS {
    interface Global {
        prisma_instance: PrismaClient;
    }
  }
}

let prisma_instance: PrismaClient;

if (!global.prisma_instance) {
    console.log("[INFO] generating new Prisma instance")
    global.prisma_instance = new PrismaClient();
}

prisma_instance = global.prisma_instance;

export default prisma_instance;