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

    async handleListUsers(ctx: Context) {
        const fromId = ctx.from?.id;
        if (!fromId || !EnvVars.Telegram.ADMIN_IDS.includes(fromId)) {
            return ctx.reply("Команда доступна только администратору.");
        }

        const players = await this.playerService.getAllPlayers();
        if (players.length === 0) {
            return ctx.reply("Пока нет зарегистрированных пользователей.");
        }

        const escapeHtml = (value: string) =>
            value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

        const groupedByDistrict = new Map<string, typeof players>();
        for (const p of players) {
            const key = p.district ?? "—";
            const arr = groupedByDistrict.get(key) ?? [];
            arr.push(p);
            groupedByDistrict.set(key, arr);
        }

        const districts = Array.from(groupedByDistrict.keys()).sort((a, b) => {
            if (a === "—") return 1;
            if (b === "—") return -1;
            return a.localeCompare(b);
        });

        const sections: string[] = [];
        for (const d of districts) {
            const users = groupedByDistrict
                .get(d)!
                .slice()
                .sort((a, b) => (b.ntrp ?? -Infinity) - (a.ntrp ?? -Infinity));

            const lines = users.map((p) => {
                const displayName = `${p.firstName}${
                    p.lastName ? " " + p.lastName : ""
                }`.trim();
                const safeName = escapeHtml(
                    displayName ||
                        (p.username ? "@" + p.username : "Пользователь")
                );
                const link = `<a href="tg://user?id=${p.id.toString()}">${safeName}</a>`;
                const userSuffix = p.username ? ` (@${p.username})` : "";
                const ntrp =
                    typeof p.ntrp === "number" ? p.ntrp.toString() : "—";
                return `• <b>${ntrp}</b> | ${link}${userSuffix}`;
            });

            sections.push(`🏙️ <b>${escapeHtml(d)}</b>\n${lines.join("\n")}`);
        }

        const header = (total: number) => `👥 Пользователи: <b>${total}</b>`;
        const MAX_LEN = 3500;
        let buffer = "";
        const total = players.length;

        for (const section of sections) {
            if (
                (buffer + "\n\n" + section).length > MAX_LEN &&
                buffer.length > 0
            ) {
                await ctx.reply(`${header(total)}\n\n${buffer}`.trim(), {
                    parse_mode: "HTML",
                });
                buffer = section;
            } else {
                buffer = buffer ? `${buffer}\n\n${section}` : section;
            }
        }

        if (buffer) {
            await ctx.reply(`${header(total)}\n\n${buffer}`.trim(), {
                parse_mode: "HTML",
            });
        }
    }
}
