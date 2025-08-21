import { Context } from "telegraf";
import { PlayerService } from "@/services/playerService";

export class CommandHandler {
    constructor(private playerService: PlayerService) {}

    handleHelp(ctx: Context) {
        ctx.reply(
            `🎾 CourtMate Bot - Помощь\n\n` +
                `Доступные команды:\n` +
                `/start - Начать/перезапустить бота\n` +
                `/help - Показать эту справку\n` +
                `/profile - Показать ваш профиль\n` +
                `/find - Найти соперника\n` +
                `/ping - Проверить работу бота`
        );
    }

    async handleProfile(ctx: Context) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const player = await this.playerService.getPlayerByTelegramId(
            telegramId
        );
        if (!player) {
            return ctx.reply(
                "Профиль не найден. Используйте /start для создания профиля."
            );
        }

        ctx.reply(
            `👤 Ваш профиль:\n\n` +
                `Имя: ${player.firstName}${
                    player.lastName ? ` ${player.lastName}` : ""
                }\n` +
                `Username: ${
                    player.username ? `@${player.username}` : "Не указан"
                }\n` +
                `Уровень: ${player.level}\n` +
                `Опыт: ${player.experience} лет\n` +
                `Рейтинг: ${player.rating}\n` +
                `Район: ${player.district || "Не указан"}\n` +
                `Предпочитаемые корты: ${
                    player.preferredCourtTypes.join(", ") || "Не указано"
                }\n` +
                `Доступность: ${player.availability.join(", ") || "Не указано"}`
        );
    }

    handlePing(ctx: Context) {
        ctx.reply("pong");
    }
}
