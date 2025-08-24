import { Context } from "telegraf";
import { PlayerService } from "../services/playerService";
import EnvVars from "@/constants/EnvVars";

const playerService = new PlayerService();

export async function handleStart(ctx: Context) {
    try {
        const telegramId = ctx.from?.id;
        if (!telegramId) {
            return ctx.reply("Ошибка: не удалось получить ID пользователя");
        }

        // Проверяем, существует ли уже игрок
        let player = await playerService.getPlayerById(BigInt(telegramId));

        if (!player) {
            // Создаем нового игрока
            player = await playerService.createPlayer({
                id: BigInt(telegramId),
                firstName: ctx.from.first_name,
                username: ctx.from.username,
                lastName: ctx.from.last_name,
                languageCode: ctx.from.language_code,
                isBot: ctx.from.is_bot,
                isPremium: ctx.from.is_premium,
                addedToAttachmentMenu: ctx.from.added_to_attachment_menu,
            });
        }

        // Если у игрока уже есть NTRP рейтинг, показываем главное меню
        if (player.ntrp) {
            return showMainMenu(ctx);
        }

        // Показываем меню для определения рейтинга
        return showRatingSelectionMenu(ctx);
    } catch (error) {
        console.error("Ошибка в handleStart:", error);
        return ctx.reply(
            "Произошла ошибка при запуске бота. Попробуйте позже."
        );
    }
}

// Меню для выбора способа определения рейтинга
function showRatingSelectionMenu(ctx: Context) {
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
            [
                {
                    text: "💬 Сообщество Digital Tennis",
                    url: EnvVars.Telegram.CHANNEL_URL,
                },
            ],
        ],
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Главное меню (показывается после определения рейтинга)
function showMainMenu(ctx: Context) {
    const message = `🎾 Главное меню Court Mate Bot

Выберите действие:`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "👥 Найти партнера", callback_data: "find_partner" },
                {
                    text: "🔍 Поиск по району",
                    callback_data: "search_by_district",
                },
            ],
            [
                { text: "📊 Мой профиль", callback_data: "show_profile" },
                { text: "⚙️ Настройки", callback_data: "settings" },
            ],
            [
                {
                    text: "💬 Сообщество Digital Tennis",
                    url: EnvVars.Telegram.CHANNEL_URL,
                },
            ],
        ],
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Обработчик для ручного указания NTRP рейтинга
export async function handleManualNTRP(ctx: Context) {
    const message = `📊 Укажите ваш рейтинг NTRP

Рейтинг должен быть от 1.0 до 7.0 с шагом 0.5

Примеры: 2.5, 3.0, 4.5

Отправьте ваш рейтинг в следующем формате:`;

    const examples = [
        "1.0 - Начинающий игрок",
        "2.5 - Нуждается в большем опыте",
        "3.5 - Хороший контроль направления",
        "4.5 - Приобрел навыки использования силы и вращения",
        "5.5 - Использует мощные удары и стабильность",
    ];

    const fullMessage = message + "\n\n" + examples.join("\n");

    return ctx.reply(fullMessage);
}

// Обработчик для начала опроса NTRP
export async function handleStartNTRPSurvey(ctx: Context) {
    const message = `📝 Опрос для определения рейтинга NTRP

Ответьте на несколько вопросов о ваших навыках игры в теннис. Это поможет нам точно определить ваш рейтинг.

Готовы начать?`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: "✅ Начать опрос",
                    callback_data: "ntrp_survey_question_0",
                },
                { text: "❌ Отмена", callback_data: "cancel_survey" },
            ],
        ],
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Обработчик для отмены опроса
export async function handleCancelSurvey(ctx: Context) {
    return showRatingSelectionMenu(ctx);
}
