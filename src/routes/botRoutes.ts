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

export function setupBotRoutes(bot: Telegraf) {
    const playerService = new PlayerService();
    const commandHandler = new CommandHandler(playerService);

    // Команда /start
    bot.start(handleStart);

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
    bot.hears(/^\d+\.?\d*$/, async (ctx) => {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        // Проверяем, есть ли у пользователя NTRP рейтинг
        const player = await playerService.getPlayerById(BigInt(telegramId));
        if (player && !player.ntrp) {
            // Если у пользователя нет рейтинга, обрабатываем как ввод NTRP
            await handleNTRPInput(ctx);
        }
    });

    // Команды
    bot.command("help", (ctx) => commandHandler.handleHelp(ctx));
    bot.command("profile", (ctx) => commandHandler.handleProfile(ctx));
    bot.hears(/ping|пинг/i, (ctx) => commandHandler.handlePing(ctx));
}
