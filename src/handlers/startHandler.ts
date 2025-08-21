import { Context } from "telegraf";
import { PlayerService } from "@/services/playerService";
import { SurveyService } from "@/services/surveyService";
import { SurveyHandler } from "./surveyHandler";

export class StartHandler {
    constructor(
        private playerService: PlayerService,
        private surveyService: SurveyService,
        private surveyHandler: SurveyHandler
    ) {}

    async handle(ctx: Context) {
        const telegramId = ctx.from?.id;
        const firstName = ctx.from?.first_name || "Игрок";
        const username = ctx.from?.username;
        const lastName = ctx.from?.last_name;
        const languageCode = ctx.from?.language_code;
        const isBot = ctx.from?.is_bot || false;
        const isPremium = ctx.from?.is_premium;
        const addedToAttachmentMenu = ctx.from?.added_to_attachment_menu;
        const allowsWriteToPm = false;

        if (!telegramId) {
            return ctx.reply("Ошибка: не удалось получить ID пользователя");
        }

        // Проверяем, есть ли уже профиль игрока
        const existingPlayer = await this.playerService.getPlayerByTelegramId(
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
        const survey = await this.surveyService.startSurvey(
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

        // Устанавливаем начальное состояние опроса
        this.surveyHandler.setSurveyState(telegramId, "level");

        const keyboard = {
            inline_keyboard: survey.options.map((option, index) => [
                {
                    text: option,
                    callback_data: `survey_level_${index}`,
                },
            ]),
        };

        ctx.reply(survey.message, { reply_markup: keyboard });
    }
}
