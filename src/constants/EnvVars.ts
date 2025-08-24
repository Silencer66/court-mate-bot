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
        CHANNEL_URL: process.env.CHANNEL_URL ?? "https://t.me/digitaltennis",
        ADMIN_ID: Number(process.env.ADMIN_ID) || 1197563966,
    },
    Database: {
        DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
} as const;

// Районы Москвы
export const MOSCOW_DISTRICTS = {
    CAO: { name: "Центральный (ЦАО)", code: "ЦАО" },
    SAO: { name: "Северный (САО)", code: "САО" },
    SVAO: { name: "Северо-Восточный (СВАО)", code: "СВАО" },
    VAO: { name: "Восточный (ВАО)", code: "ВАО" },
    YUVAO: { name: "Юго-Восточный (ЮВАО)", code: "ЮВАО" },
    YUAO: { name: "Южный (ЮАО)", code: "ЮАО" },
    YUZAO: { name: "Юго-Западный (ЮЗАО)", code: "ЮЗАО" },
    ZAO: { name: "Западный (ЗАО)", code: "ЗАО" },
    SZAO: { name: "Северо-Западный (СЗАО)", code: "СЗАО" },
    ZELAO: { name: "Зеленоградский (ЗелАО)", code: "ЗелАО" },
    NAO: { name: "Новомосковский (НАО)", code: "НАО" },
    TAO: { name: "Троицкий (ТАО)", code: "ТАО" },
} as const;

export type MoscowDistrictCode = keyof typeof MOSCOW_DISTRICTS;
