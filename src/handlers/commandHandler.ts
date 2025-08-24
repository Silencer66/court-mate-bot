import { Context } from "telegraf";
import { PlayerService } from "@/services/playerService";
import EnvVars from "@/constants/EnvVars";

export class CommandHandler {
    constructor(private playerService: PlayerService) {}

    handleHelp(ctx: Context) {
        ctx.reply(
            `🎾 CourtMate Bot - Помощь\n\n` +
                `Доступные команды:\n` +
                `/start - Начать/перезапустить бота\n` +
                `/help - Показать эту справку\n` +
                `/profile - Показать ваш профиль\n` +
                `/ping - Проверить работу бота\n` +
                `/community - Перейти в наш Telegram-канал`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "💬 Сообщество Digital Tennis",
                                url: EnvVars.Telegram.CHANNEL_URL,
                            },
                        ],
                    ],
                },
            }
        );
    }

    async handleProfile(ctx: Context) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const player = await this.playerService.getPlayerById(
            BigInt(telegramId)
        );
        if (!player) {
            return ctx.reply(
                "Профиль не найден. Используйте /start для создания профиля."
            );
        }

        const ntrpText = player.ntrp
            ? `NTRP рейтинг: ${player.ntrp}`
            : "NTRP рейтинг: Не указан";
        const districtText = player.district || "Не указан";
        const courtTypesText =
            player.preferredCourtTypes.length > 0
                ? player.preferredCourtTypes.join(", ")
                : "Не указано";

        ctx.reply(
            `👤 Ваш профиль:\n\n` +
                `Имя: ${player.firstName}${
                    player.lastName ? ` ${player.lastName}` : ""
                }\n` +
                `Username: ${
                    player.username ? `@${player.username}` : "Не указан"
                }\n` +
                `${ntrpText}\n` +
                `Район: ${districtText}\n` +
                `Предпочитаемые корты: ${courtTypesText}`
        );
    }

    handlePing(ctx: Context) {
        ctx.reply("pong");
    }

    handleSettings(ctx: Context) {
        ctx.reply(
            `⚙️ Настройки\n\n` +
                `Эта функция находится в разработке.\n` +
                `В будущем здесь можно будет изменить:\n` +
                `• NTRP рейтинг\n` +
                `• Предпочитаемые покрытия\n` +
                `• Район проживания\n` +
                `• Язык бота`
        );
    }

    handleFindPartner(ctx: Context) {
        ctx.reply(
            `👥 Поиск партнера\n\n` +
                `Эта функция находится в разработке.\n` +
                `В будущем здесь можно будет найти партнеров по игре\n` +
                `с учетом вашего NTRP рейтинга и района.`
        );
    }

    handleSearchByDistrict(ctx: Context) {
        ctx.reply(
            `🔍 Поиск по району\n\n` +
                `Эта функция находится в разработке.\n` +
                `В будущем здесь можно будет найти игроков\n` +
                `в вашем районе для совместной игры.`
        );
    }

    handleCommunity(ctx: Context) {
        ctx.reply(`Присоединяйся к нашему сообществу Digital Tennis 🎾`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Открыть канал",
                            url: EnvVars.Telegram.CHANNEL_URL,
                        },
                    ],
                ],
            },
        });
    }
}
