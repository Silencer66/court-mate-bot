import "dotenv/config";
import { Telegraf } from "telegraf";
import { PlayerService } from "@/services/playerService";
import { SurveyService } from "@/services/surveyService";
import EnvVars from "@/constants/EnvVars";

const botToken = EnvVars.Telegram.BOT_TOKEN;
if (!botToken) {
    console.error("BOT_TOKEN is not set in environment variables");
    process.exit(1);
}

const bot = new Telegraf(botToken);
const playerService = new PlayerService();
const surveyService = new SurveyService();

// Хранилище состояния опроса для каждого пользователя
const surveyStates = new Map<number, { step: string; playerId: string }>();

bot.start(async (ctx) => {
    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name || "Игрок";
    const username = ctx.from?.username;
    const lastName = ctx.from?.last_name;
    const languageCode = ctx.from?.language_code;
    const isBot = ctx.from?.is_bot || false;
    const isPremium = ctx.from?.is_premium;
    const addedToAttachmentMenu = ctx.from?.added_to_attachment_menu;
    const allowsWriteToPm = false; // Недоступно в текущих типах Telegraf

    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    // Проверяем, есть ли уже профиль игрока
    const existingPlayer = await playerService.getPlayerByTelegramId(
        telegramId
    );

    if (existingPlayer) {
        return ctx.reply(
            `🎾 С возвращением, ${firstName}!\n\nВаш уровень: ${
                existingPlayer.level
            }\nОпыт: ${existingPlayer.experience} лет\nРейтинг: ${
                existingPlayer.rating
            }\nРайон: ${
                existingPlayer.district || "Не указан"
            }\n\nИспользуйте /help для списка команд.`
        );
    }

    // Начинаем опрос для нового игрока
    const survey = await surveyService.startSurvey(
        telegramId,
        firstName,
        username,
        lastName,
        languageCode,
        isBot,
        isPremium,
        addedToAttachmentMenu,
        allowsWriteToPm
    );
    surveyStates.set(telegramId, {
        step: "level",
        playerId: survey.playerId.toString(),
    });

    const keyboard = {
        inline_keyboard: survey.options.map((option, index) => [
            {
                text: option,
                callback_data: `survey_level_${index}`,
            },
        ]),
    };

    ctx.reply(survey.message, { reply_markup: keyboard });
});

// Обработка ответов на опрос
bot.action(/survey_level_(\d+)/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const surveyState = surveyStates.get(telegramId);
    if (!surveyState || surveyState.step !== "level") return;

    const levelOptions = [
        "🎯 Новичок (играю меньше года)",
        "🏆 Любитель (играю 1-3 года)",
        "⭐ Продвинутый (играю 3-5 лет)",
        "🔥 Эксперт (играю больше 5 лет)",
    ];

    const answer = levelOptions[parseInt(ctx.match[1] || "0")];
    if (!answer) return;
    const result = await surveyService.processLevelAnswer(telegramId, answer);

    surveyStates.set(telegramId, {
        step: "experience",
        playerId: surveyState.playerId,
    });

    const keyboard = {
        inline_keyboard: result.options.map((option, index) => [
            {
                text: option,
                callback_data: `survey_experience_${index}`,
            },
        ]),
    };

    ctx.editMessageText(result.message, { reply_markup: keyboard });
});

bot.action(/survey_experience_(\d+)/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const surveyState = surveyStates.get(telegramId);
    if (!surveyState || surveyState.step !== "experience") return;

    const experienceOptions = [
        "🆕 Меньше года",
        "📖 1-3 года",
        "📚 3-5 лет",
        "🎓 Больше 5 лет",
    ];

    const answer = experienceOptions[parseInt(ctx.match[1] || "0")];
    if (!answer) return;
    const result = await surveyService.processExperienceAnswer(
        telegramId,
        answer
    );

    surveyStates.set(telegramId, {
        step: "rating",
        playerId: surveyState.playerId,
    });

    const keyboard = {
        inline_keyboard: result.options.map((option, index) => [
            {
                text: option,
                callback_data: `survey_rating_${index}`,
            },
        ]),
    };

    ctx.editMessageText(result.message, { reply_markup: keyboard });
});

bot.action(/survey_rating_(\d+)/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const surveyState = surveyStates.get(telegramId);
    if (!surveyState || surveyState.step !== "rating") return;

    const ratingOptions = [
        "🥉 1000-1200 (новичок)",
        "🥈 1200-1400 (любитель)",
        "🥇 1400-1600 (продвинутый)",
        "👑 1600+ (эксперт)",
    ];

    const answer = ratingOptions[parseInt(ctx.match[1] || "0")];
    if (!answer) return;
    const result = await surveyService.processRatingAnswer(telegramId, answer);

    surveyStates.set(telegramId, {
        step: "courtType",
        playerId: surveyState.playerId,
    });

    const keyboard = {
        inline_keyboard: result.options.map((option, index) => [
            {
                text: option,
                callback_data: `survey_court_${index}`,
            },
        ]),
    };

    ctx.editMessageText(result.message, { reply_markup: keyboard });
});

bot.action(/survey_court_(\d+)/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const surveyState = surveyStates.get(telegramId);
    if (!surveyState || surveyState.step !== "courtType") return;

    const courtOptions = ["🟢 Хард", "🟤 Грунт", "🌱 Трава", "🔴 Ковер"];

    const answer = courtOptions[parseInt(ctx.match[1] || "0")];
    if (!answer) return;
    const result = await surveyService.processCourtTypeAnswer(
        telegramId,
        answer
    );

    surveyStates.set(telegramId, {
        step: "district",
        playerId: surveyState.playerId,
    });

    ctx.editMessageText(result.message);
});

// Обработка текстового ответа для района
bot.hears(/.*/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const surveyState = surveyStates.get(telegramId);
    if (!surveyState) return;

    if (surveyState.step === "district") {
        const result = await surveyService.processDistrictAnswer(
            telegramId,
            ctx.message.text || ""
        );

        surveyStates.set(telegramId, {
            step: "availability",
            playerId: surveyState.playerId,
        });

        ctx.reply(result.message);
        return;
    }

    if (surveyState.step === "availability") {
        const result = await surveyService.processAvailabilityAnswer(
            telegramId,
            ctx.message.text || ""
        );

        // Очищаем состояние опроса
        surveyStates.delete(telegramId);

        ctx.reply(result.message);
        return;
    }
});

bot.hears(/ping|пинг/i, (ctx) => ctx.reply("pong"));

bot.command("help", (ctx) => {
    ctx.reply(
        `🎾 CourtMate Bot - Помощь\n\n` +
            `Доступные команды:\n` +
            `/start - Начать/перезапустить бота\n` +
            `/help - Показать эту справку\n` +
            `/profile - Показать ваш профиль\n` +
            `/find - Найти соперника\n` +
            `/ping - Проверить работу бота`
    );
});

bot.command("profile", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const player = await playerService.getPlayerByTelegramId(telegramId);
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
});

bot.launch().then(() => {
    console.log("Bot started with new architecture");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
