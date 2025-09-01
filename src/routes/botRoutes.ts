import { Telegraf } from "telegraf";
import {
    handleStart,
    handleManualNTRP,
    handleStartNTRPSurvey,
    handleCancelSurvey,
} from "@/handlers/startHandler";
import {
    handleNTRPSurveyQuestion,
    handleNTRPAnswer,
    handleCourtTypeSelection,
    handleFinishCourtSelection,
    handleDistrictSelection,
} from "@/handlers/ntrpSurveyHandler";
import { handleNTRPInput } from "@/handlers/ntrpInputHandler";
import { CommandHandler } from "@/handlers/commandHandler";
import { PlayerService } from "@/services/playerService";
import EnvVars from "@/constants/EnvVars";
import {
    registerGameHandlers,
    handlePhotoInWizard,
    handleTextInWizard,
    isInGameCreationWizard,
} from "@/handlers/gameHandler";

export function setupBotRoutes(bot: Telegraf) {
    const playerService = new PlayerService();
    const commandHandler = new CommandHandler(playerService);

    // Регистрируем slash-команды для подсказок Telegram
    bot.telegram.setMyCommands([
        { command: "start", description: "Запустить бота" },
        { command: "help", description: "Справка" },
        { command: "profile", description: "Мой профиль" },
        { command: "community", description: "Сообщество Digital Tennis" },
        { command: "ping", description: "Проверить работу бота" },
        { command: "games", description: "Активные игры" },
    ]);

    // Отдельно добавим админские команды в подсказки для каждого администратора
    for (const adminId of EnvVars.Telegram.ADMIN_IDS) {
        bot.telegram.setMyCommands(
            [
                {
                    command: "users",
                    description: "Список пользователей (админ)",
                },
                { command: "newgame", description: "Создать игру (админ)" },
                { command: "profile", description: "Мой профиль" },
                { command: "ping", description: "Проверить работу бота" },
            ],
            { scope: { type: "chat", chat_id: adminId } as any }
        );
    }

    // Команда /start (обрабатываем deep-link payload: join_<gameId>)
    bot.start(async (ctx) => {
        const payload = (ctx as any).startPayload as string | undefined;
        if (payload && payload.startsWith("join_")) {
            // Просто сохраняем, дальнейшая логика в handleStart/анкете
            const gameId = Number(payload.split("_")[1]);
            if (!Number.isNaN(gameId)) {
                try {
                    const { setPendingJoin } = await import(
                        "@/state/pendingJoin"
                    );
                    setPendingJoin(ctx.from!.id, gameId);
                } catch {}
            }
        }
        return handleStart(ctx as any);
    });

    // Обработчики для определения NTRP рейтинга
    bot.action("set_ntrp_manual", handleManualNTRP);
    bot.action("start_ntrp_survey", handleStartNTRPSurvey);
    bot.action("cancel_survey", handleCancelSurvey);

    // Обработчики для опроса NTRP
    bot.action(/ntrp_survey_question_(\d+)/, handleNTRPSurveyQuestion);
    bot.action(/ntrp_answer_(.+)_(.+)/, handleNTRPAnswer);

    // Обработчики для выбора покрытий и районов
    bot.action(/court_type_(.+)/, handleCourtTypeSelection);
    bot.action("finish_court_selection", handleFinishCourtSelection);
    bot.action(/district_(.+)/, handleDistrictSelection);

    // Обработчики для главного меню
    bot.action("show_profile", (ctx) => commandHandler.handleProfile(ctx));
    bot.action("settings", (ctx) => commandHandler.handleSettings(ctx));
    bot.action("find_partner", (ctx) => commandHandler.handleFindPartner(ctx));
    bot.action("search_by_district", (ctx) =>
        commandHandler.handleSearchByDistrict(ctx)
    );

    // Обработка текстовых сообщений для ручного ввода NTRP
    bot.hears(/^\d+\.?\d*$/, async (ctx, next) => {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;
        // Если пользователь в мастере создания игры — не обрабатываем как ввод NTRP
        if (isInGameCreationWizard(telegramId)) return next();
        // Проверяем, есть ли у пользователя NTRP рейтинг
        const player = await playerService.getPlayerById(BigInt(telegramId));
        if (player && !player.ntrp) {
            // Если у пользователя нет рейтинга, обрабатываем как ввод NTRP
            await handleNTRPInput(ctx);
            return;
        }
        return next();
    });

    // Команды
    bot.command("help", (ctx) => commandHandler.handleHelp(ctx));
    bot.command("profile", (ctx) => commandHandler.handleProfile(ctx));
    bot.command("ping", (ctx) => commandHandler.handlePing(ctx));
    bot.command("community", (ctx) => commandHandler.handleCommunity(ctx));
    bot.command("users", (ctx) => commandHandler.handleListUsers(ctx));
    bot.hears(/ping|пинг/i, (ctx) => commandHandler.handlePing(ctx));

    // Игры: команды и callbacks
    registerGameHandlers(bot);
    bot.on("photo", handlePhotoInWizard);
    bot.on("text", handleTextInWizard);
}
