import { Telegraf } from "telegraf";
import { StartHandler } from "@/handlers/startHandler";
import { SurveyHandler } from "@/handlers/surveyHandler";
import { CommandHandler } from "@/handlers/commandHandler";
import { PlayerService } from "@/services/playerService";
import { SurveyService } from "@/services/surveyService";

export function setupBotRoutes(bot: Telegraf) {
    const playerService = new PlayerService();
    const surveyService = new SurveyService();

    const surveyHandler = new SurveyHandler(surveyService);
    const startHandler = new StartHandler(
        playerService,
        surveyService,
        surveyHandler
    );
    const commandHandler = new CommandHandler(playerService);

    // Команда /start
    bot.start((ctx) => startHandler.handle(ctx));

    // Обработка ответов на опрос
    bot.action(/survey_level_(\d+)/, async (ctx) => {
        await surveyHandler.handleLevelAnswer(ctx);
    });

    bot.action(/survey_experience_(\d+)/, (ctx) =>
        surveyHandler.handleExperienceAnswer(ctx)
    );
    bot.action(/survey_rating_(\d+)/, (ctx) =>
        surveyHandler.handleRatingAnswer(ctx)
    );
    bot.action(/survey_court_(\d+)/, (ctx) =>
        surveyHandler.handleCourtTypeAnswer(ctx)
    );

    // Обработка текстовых ответов для опроса
    bot.hears(/.*/, (ctx) => {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const surveyState = surveyHandler.getSurveyState(telegramId);
        if (!surveyState) return;

        if (surveyState === "district") {
            surveyHandler.handleDistrictAnswer(ctx);
            return;
        }

        if (surveyState === "availability") {
            surveyHandler.handleAvailabilityAnswer(ctx);
            return;
        }
    });

    // Команды
    bot.command("help", (ctx) => commandHandler.handleHelp(ctx));
    bot.command("profile", (ctx) => commandHandler.handleProfile(ctx));
    bot.hears(/ping|пинг/i, (ctx) => commandHandler.handlePing(ctx));
}
