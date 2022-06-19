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
    global.prisma_instance = new PrismaClient({
      //log: ['query', 'info', 'warn', 'error'],
    });
}

prisma_instance = global.prisma_instance;

export default prisma_instance;

export function exclude<User, Key extends keyof User>(
  user: User,
  ...keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key]
  }
  return user
}
