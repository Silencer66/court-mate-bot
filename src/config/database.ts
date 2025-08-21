import { PrismaClient } from "@prisma/client";
import EnvVars from "@/constants/EnvVars";

declare global {
    var __prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.__prisma ||
    new PrismaClient({
        log:
            EnvVars.NodeEnv === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (EnvVars.NodeEnv !== "production") {
    globalThis.__prisma = prisma;
}

export default prisma;
