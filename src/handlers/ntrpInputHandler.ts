import { Context } from "telegraf";
import { PlayerService } from "../services/playerService";
import { validateNTRPRating } from "../services/ntrpService";

const playerService = new PlayerService();

// Обработчик для ручного ввода NTRP рейтинга
export async function handleNTRPInput(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    const message =
        ctx.message && "text" in ctx.message ? ctx.message.text : undefined;
    if (!message) {
        return ctx.reply("Пожалуйста, введите ваш рейтинг NTRP");
    }

    // Парсим рейтинг
    const rating = parseFloat(message);

    if (isNaN(rating)) {
        return ctx.reply(
            "❌ Пожалуйста, введите корректное число (например: 2.5, 3.0, 4.5)"
        );
    }

    // Валидируем рейтинг
    if (!validateNTRPRating(rating)) {
        return ctx.reply(`❌ Некорректный рейтинг!

Рейтинг должен быть от 1.0 до 7.0 с шагом 0.5.

Примеры корректных рейтингов:
• 1.0, 1.5, 2.0, 2.5, 3.0, 3.5
• 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0

Попробуйте еще раз:`);
    }

    try {
        // Сохраняем рейтинг в базу данных
        await playerService.updatePlayerNTRP(BigInt(telegramId), {
            ntrp: rating,
        });

        const successMessage = `✅ Отлично! Ваш рейтинг NTRP: ${rating}

Теперь давайте определим ваши предпочтения по покрытиям кортов.`;

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: "🏟️ Хард (Хард)",
                        callback_data: "court_type_HARD",
                    },
                    {
                        text: "🏟️ Грунт (CLAY)",
                        callback_data: "court_type_CLAY",
                    },
                ],
                [
                    {
                        text: "🏟️ Трава (GRASS)",
                        callback_data: "court_type_GRASS",
                    },
                ],
                [
                    {
                        text: "✅ Завершить выбор",
                        callback_data: "finish_court_selection",
                    },
                ],
            ],
        };

        return ctx.reply(successMessage, { reply_markup: keyboard });
    } catch (error) {
        console.error("Ошибка при сохранении NTRP рейтинга:", error);
        return ctx.reply(
            "Произошла ошибка при сохранении рейтинга. Попробуйте позже."
        );
    }
}

// Обработчик для отмены ручного ввода
export async function handleCancelManualInput(ctx: Context) {
    const message = `🎾 Добро пожаловать в Court Mate Bot!

Помоги нам определить твой рейтинг NTRP для лучшего подбора партнеров по игре.`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: "📊 Указать рейтинг NTRP",
                    callback_data: "set_ntrp_manual",
                },
                {
                    text: "📝 Пройти небольшой опрос",
                    callback_data: "start_ntrp_survey",
                },
            ],
        ],
    };

    return ctx.reply(message, { reply_markup: keyboard });
}
