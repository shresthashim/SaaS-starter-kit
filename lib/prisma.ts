import { PrismaClient } from "@prisma/client";

const prismaSingleton = () => {
  return new PrismaClient();
};

const globalPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalPrisma.prisma ?? prismaSingleton();

if (process.env.NODE_ENV !== "production") {
  globalPrisma.prisma = prisma;
}

export default prisma;
