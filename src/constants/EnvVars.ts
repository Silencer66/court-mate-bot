/**
 * Environments variables declared here.
 */

/* eslint-disable node/no-process-env */

export default {
    NodeEnv: process.env.NODE_ENV ?? "",
    Port: Number(process.env.PORT) ?? 0,
    HostingDomains: process.env.DOMAIN_URIS?.split(",") ?? ["localhost"],
    Telegram: {
        BOT_TOKEN: process.env.BOT_TOKEN ?? "",
        LOGS_CHAT_ID: Number(process.env.LOGS_CHAT_ID) ?? -1002673541495,
    },
    Database: {
        DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
} as const;
