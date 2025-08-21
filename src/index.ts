import "dotenv/config";
import { Telegraf } from "telegraf";
import EnvVars from "@/constants/EnvVars";
import { setupBotRoutes } from "@/routes/botRoutes";

const botToken = EnvVars.Telegram.BOT_TOKEN;
if (!botToken) {
    console.error("BOT_TOKEN is not set in environment variables");
    process.exit(1);
}

const bot = new Telegraf(botToken);

// Настраиваем все маршруты бота
setupBotRoutes(bot);

// Запускаем бота
bot.launch().then(() => {
    console.log("Bot started with modular architecture");
});

// Обработка сигналов завершения
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
