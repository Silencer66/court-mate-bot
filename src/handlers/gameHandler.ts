import { Context, Telegraf } from "telegraf";
import EnvVars from "@/constants/EnvVars";
import { GameService, formatGameFull } from "@/services/gameService";
import { PlayerService } from "@/services/playerService";
import { setPendingJoin } from "@/state/pendingJoin";

const gameService = new GameService();
const playerService = new PlayerService();

type WizardState = {
    step: number;
    draft: {
        title?: string;
        description?: string;
        location?: string;
        startsAt?: Date;
        maxPlayers?: number;
        levelHint?: string;
        photoFileId?: string;
    };
};

const wizardState = new Map<number, WizardState>();

export function registerGameHandlers(bot: Telegraf) {
    bot.command("newgame", startNewGameWizard);
    bot.command("games", listActiveGames);

    bot.action(/game_join_(\d+)/, handleJoinGame);
    bot.action(/game_leave_(\d+)/, handleLeaveGame);
    bot.action(/game_list_(\d+)/, handleListPlayers);
}

export function isInGameCreationWizard(userId: number): boolean {
    return wizardState.has(userId);
}

async function startNewGameWizard(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || !EnvVars.Telegram.ADMIN_IDS.includes(userId)) {
        return ctx.reply("Команда доступна только администратору.");
    }
    const fromId = userId;
    wizardState.set(fromId, { step: 1, draft: {} });
    await ctx.reply(
        "Создаем игру. Шаг 1/6: Введите дату и время (например, 25.12 19:30)"
    );
}

export async function handleTextInWizard(ctx: Context) {
    const fromId = ctx.from?.id;
    if (!fromId) return;
    const state = wizardState.get(fromId);
    if (!state) return; // не в мастере

    const text = (ctx.message as any)?.text?.trim();
    if (!text) return;

    switch (state.step) {
        case 1: {
            const date = parseRuDate(text);
            if (!date)
                return ctx.reply(
                    "Не удалось распознать дату. Пример: 25.12 19:30"
                );
            state.draft.startsAt = date;
            state.step = 2;
            return ctx.reply("Шаг 2/6: Укажите локацию (корты/адрес)");
        }
        case 2: {
            state.draft.location = text;
            state.step = 3;
            return ctx.reply(
                "Шаг 3/6: Лимит игроков (число) или '-' для без лимита"
            );
        }
        case 3: {
            if (text !== "-") {
                const n = Number(text);
                if (!Number.isInteger(n) || n <= 0)
                    return ctx.reply("Введите положительное число или '-'");
                state.draft.maxPlayers = n;
            }
            state.step = 4;
            return ctx.reply(
                "Шаг 4/6: Укажите уровень/NTRP (например: NTRP 2.5–3.0) или '-' пропустить"
            );
        }
        case 4: {
            if (text !== "-") state.draft.levelHint = text;
            state.step = 5;
            return ctx.reply("Шаг 5/6: Заголовок поста или '-' пропустить");
        }
        case 5: {
            if (text !== "-") state.draft.title = text;
            state.step = 6;
            return ctx.reply(
                "Шаг 6/6: Описание/комментарий или '-' пропустить. Можно прислать фото сообщением после этого шага."
            );
        }
        case 6: {
            if (text !== "-") state.draft.description = text;
            // Завершение
            const draft = state.draft;
            if (!draft.startsAt) return ctx.reply("Ошибка: не указана дата");
            const game = await gameService.createGame({
                creatorId: BigInt(fromId),
                startsAt: draft.startsAt,
                title: draft.title,
                description: draft.description,
                location: draft.location,
                maxPlayers: draft.maxPlayers,
                photoFileId: draft.photoFileId,
                levelHint: draft.levelHint,
            });

            const joinedCount = 0;
            const textToSend = formatGameFull(game, joinedCount);
            const keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Записаться",
                            callback_data: `game_join_${game.id}`,
                        },
                        {
                            text: "👥 Список игроков",
                            callback_data: `game_list_${game.id}`,
                        },
                        {
                            text: "🚫 Отменить запись",
                            callback_data: `game_leave_${game.id}`,
                        },
                    ],
                ],
            } as const;

            const channelId = EnvVars.Telegram.CHANNEL_ID;
            if (!channelId) {
                await ctx.reply(
                    "CHANNEL_ID не настроен в .env. Укажите CHANNEL_ID и перезапустите бота."
                );
            } else {
                let messageId: number | null = null;
                if (draft.photoFileId) {
                    const res = await ctx.telegram.sendPhoto(
                        channelId,
                        draft.photoFileId,
                        {
                            caption: textToSend,
                            parse_mode: "HTML",
                            reply_markup: keyboard as any,
                        }
                    );
                    messageId = res.message_id;
                } else {
                    const res = await ctx.telegram.sendMessage(
                        channelId,
                        textToSend,
                        {
                            parse_mode: "HTML",
                            reply_markup: keyboard as any,
                        }
                    );
                    messageId = res.message_id;
                }
                await gameService.setPublishInfo(game.id, {
                    channelChatId: BigInt(channelId),
                    channelMessageId: messageId!,
                });
                await ctx.reply(`Игра опубликована в канале. ID: ${game.id}`);
            }

            wizardState.delete(fromId);
            return;
        }
        default:
            return;
    }
}

export async function handlePhotoInWizard(ctx: Context) {
    const fromId = ctx.from?.id;
    if (!fromId) return;
    const state = wizardState.get(fromId);
    if (!state) return;
    const photo = (ctx.message as any).photo?.pop();
    if (!photo) return;
    state.draft.photoFileId = photo.file_id;
    await ctx.reply("Фото сохранено. Продолжайте заполнять поля.");
}

async function listActiveGames(ctx: Context) {
    const games = await gameService.getActiveGames();
    if (games.length === 0) return ctx.reply("Активных игр нет.");
    for (const g of games) {
        const count = await gameService.countJoined(g.id);
        await ctx.replyWithHTML(
            `${formatGameFull(g, count)}\n\nID игры: ${g.id}`
        );
    }
}

async function handleJoinGame(ctx: Context) {
    const gameId = Number((ctx.callbackQuery as any).data.split("_")[2]);
    const playerId = BigInt(ctx.from!.id);
    // Проверим, есть ли профиль игрока и заполнен ли NTRP
    const player = await playerService.getPlayerById(playerId);
    if (!player || !player.ntrp || !player.district) {
        // Сохраняем намерение записаться и отправляем в /start
        setPendingJoin(Number(playerId), gameId);
        const botUsername = ctx.botInfo?.username;
        const deepLink = botUsername
            ? `https://t.me/${botUsername}?start=join_${gameId}`
            : undefined;
        // Пытаемся отправить ссылку в ЛС
        if (deepLink) {
            try {
                await ctx.telegram.sendMessage(
                    ctx.from!.id,
                    `Чтобы записаться на игру, откройте бот и нажмите Старт.`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Открыть бота",
                                        url: deepLink,
                                    },
                                ],
                            ],
                        } as any,
                    }
                );
            } catch {}
        }
        await ctx.answerCbQuery(
            deepLink
                ? "Проверьте ЛС: отправил ссылку для запуска бота"
                : "Откройте чат с ботом и нажмите /start",
            { show_alert: true }
        );
        return;
    }

    const res = await gameService.joinGame(gameId, playerId);
    await ctx.answerCbQuery(
        res.joined ? "Вы записаны" : res.reason || "Ошибка"
    );
}

async function handleLeaveGame(ctx: Context) {
    const gameId = Number((ctx.callbackQuery as any).data.split("_")[2]);
    const playerId = BigInt(ctx.from!.id);
    const res = await gameService.leaveGame(gameId, playerId);
    await ctx.answerCbQuery(
        res.left ? "Запись отменена" : res.reason || "Ошибка"
    );
}

async function handleListPlayers(ctx: Context) {
    const gameId = Number((ctx.callbackQuery as any).data.split("_")[2]);
    const signups = await gameService.getSignups(gameId);
    if (signups.length === 0) {
        return ctx.answerCbQuery("Пока никто не записался", {
            show_alert: true,
        });
    }

    const ids = signups.map((s) => s.playerId);
    const players = await playerService.getPlayersByIds(ids);
    const playerById = new Map(players.map((p) => [p.id.toString(), p]));

    const lines = signups.map((s, i) => {
        const p = playerById.get(s.playerId.toString());
        const displayName = p
            ? `${p.firstName}${p.lastName ? " " + p.lastName : ""}`.trim()
            : `Игрок`;
        const username = p?.username ? ` (@${p.username})` : "";
        return `${i + 1}. ${displayName}${username}`;
    });

    const text = lines.join("\n");
    await ctx.answerCbQuery(text.slice(0, 190), { show_alert: true });
}

function parseRuDate(input: string): Date | null {
    // форматы: 25.12 19:30, 25.12.2025 19:30
    const re = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\s+(\d{1,2}):(\d{2})$/;
    const m = input.match(re);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = m[3] ? Number(m[3]) : new Date().getFullYear();
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const dt = new Date(year, month, day, hour, minute);
    return isNaN(dt.getTime()) ? null : dt;
}
