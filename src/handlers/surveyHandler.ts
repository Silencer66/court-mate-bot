import { Context } from "telegraf";
import { SurveyService } from "@/services/surveyService";

interface SurveyContext extends Context {
    match?: RegExpMatchArray;
}

export class SurveyHandler {
    constructor(private surveyService: SurveyService) {}

    // Хранилище состояния опроса для каждого пользователя
    private surveyStates = new Map<number, string>();

    async handleLevelAnswer(ctx: SurveyContext) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "level") return;

        const levelOptions = [
            "🎯 Новичок (играю меньше года)",
            "🏆 Любитель (играю 1-3 года)",
            "⭐ Продвинутый (играю 3-5 лет)",
            "🔥 Эксперт (играю больше 5 лет)",
        ];

        const answer = levelOptions[parseInt(ctx.match?.[1] || "0")];
        if (!answer) return;

        const result = await this.surveyService.processLevelAnswer(
            telegramId,
            answer
        );

        this.surveyStates.set(telegramId, "experience");

        const keyboard = {
            inline_keyboard: result.options.map((option, index) => [
                {
                    text: option,
                    callback_data: `survey_experience_${index}`,
                },
            ]),
        };

        ctx.editMessageText(result.message, { reply_markup: keyboard });
    }

    async handleExperienceAnswer(ctx: SurveyContext) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "experience") return;

        const experienceOptions = [
            "🆕 Меньше года",
            "📖 1-3 года",
            "📚 3-5 лет",
            "🎓 Больше 5 лет",
        ];

        const answer = experienceOptions[parseInt(ctx.match?.[1] || "0")];
        if (!answer) return;

        const result = await this.surveyService.processExperienceAnswer(
            telegramId,
            answer
        );

        this.surveyStates.set(telegramId, "rating");

        const keyboard = {
            inline_keyboard: result.options.map((option, index) => [
                {
                    text: option,
                    callback_data: `survey_rating_${index}`,
                },
            ]),
        };

        ctx.editMessageText(result.message, { reply_markup: keyboard });
    }

    async handleRatingAnswer(ctx: SurveyContext) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "rating") return;

        const ratingOptions = [
            "🥉 1000-1200 (новичок)",
            "🥈 1200-1400 (любитель)",
            "🥇 1400-1600 (продвинутый)",
            "👑 1600+ (эксперт)",
        ];

        const answer = ratingOptions[parseInt(ctx.match?.[1] || "0")];
        if (!answer) return;

        const result = await this.surveyService.processRatingAnswer(
            telegramId,
            answer
        );

        this.surveyStates.set(telegramId, "courtType");

        const keyboard = {
            inline_keyboard: result.options.map((option, index) => [
                {
                    text: option,
                    callback_data: `survey_court_${index}`,
                },
            ]),
        };

        ctx.editMessageText(result.message, { reply_markup: keyboard });
    }

    async handleCourtTypeAnswer(ctx: SurveyContext) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "courtType") return;

        const courtOptions = ["🟢 Хард", "🟤 Грунт", "🌱 Трава", "🔴 Ковер"];

        const answer = courtOptions[parseInt(ctx.match?.[1] || "0")];
        if (!answer) return;

        const result = await this.surveyService.processCourtTypeAnswer(
            telegramId,
            answer
        );

        this.surveyStates.set(telegramId, "district");

        ctx.editMessageText(result.message);
    }

    async handleDistrictAnswer(ctx: Context) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "district") return;

        const messageText =
            ctx.message && "text" in ctx.message ? ctx.message.text : "";
        const result = await this.surveyService.processDistrictAnswer(
            telegramId,
            messageText || ""
        );

        this.surveyStates.set(telegramId, "availability");

        ctx.reply(result.message);
    }

    async handleAvailabilityAnswer(ctx: Context) {
        const telegramId = ctx.from?.id;
        if (!telegramId) return;

        const currentStep = this.surveyStates.get(telegramId);
        if (!currentStep || currentStep !== "availability") return;

        const messageText =
            ctx.message && "text" in ctx.message ? ctx.message.text : "";
        const result = await this.surveyService.processAvailabilityAnswer(
            telegramId,
            messageText || ""
        );

        // Очищаем состояние опроса
        this.surveyStates.delete(telegramId);

        ctx.reply(result.message);
    }

    setSurveyState(telegramId: number, step: string) {
        this.surveyStates.set(telegramId, step);
    }

    getSurveyState(telegramId: number) {
        return this.surveyStates.get(telegramId);
    }
}
