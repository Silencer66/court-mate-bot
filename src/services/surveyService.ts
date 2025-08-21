import { PlayerService } from "@/services/playerService";
import { PlayerLevel, CourtType } from "@/types/tennis";

export class SurveyService {
    private playerService: PlayerService;

    constructor() {
        this.playerService = new PlayerService();
    }

    async startSurvey(
        telegramId: number,
        firstName: string,
        username?: string,
        lastName?: string,
        languageCode?: string,
        isBot: boolean = false,
        isPremium?: boolean,
        addedToAttachmentMenu?: boolean,
        allowsWriteToPm?: boolean
    ) {
        // Создаем игрока с базовыми данными
        const player = await this.playerService.createPlayer(
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

        return {
            playerId: player.id,
            currentStep: "level",
            message: this.getLevelQuestion(),
            options: this.getLevelOptions(),
        };
    }

    private getLevelQuestion(): string {
        return `🎾 Добро пожаловать в CourtMate! Давайте определим ваш уровень игры.\n\nКак бы вы оценили свой уровень тенниса?`;
    }

    private getLevelOptions(): string[] {
        return [
            "🎯 Новичок (играю меньше года)",
            "🏆 Любитель (играю 1-3 года)",
            "⭐ Продвинутый (играю 3-5 лет)",
            "🔥 Эксперт (играю больше 5 лет)",
        ];
    }

    async processLevelAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; options: string[]; nextStep: string }> {
        const level = this.parseLevelAnswer(answer);
        await this.playerService.updatePlayerLevel(telegramId, level);

        return {
            message: this.getExperienceQuestion(),
            options: this.getExperienceOptions(),
            nextStep: "experience",
        };
    }

    async processExperienceAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; options: string[]; nextStep: string }> {
        const experience = this.parseExperienceAnswer(answer);
        await this.playerService.updatePlayerExperience(telegramId, experience);

        return {
            message: this.getRatingQuestion(),
            options: this.getRatingOptions(),
            nextStep: "rating",
        };
    }

    async processRatingAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; options: string[]; nextStep: string }> {
        const rating = this.parseRatingAnswer(answer);
        await this.playerService.updatePlayerRating(telegramId, rating);

        return {
            message: this.getCourtTypeQuestion(),
            options: this.getCourtTypeOptions(),
            nextStep: "courtType",
        };
    }

    async processCourtTypeAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; nextStep: string }> {
        const courtTypes = this.parseCourtTypeAnswer(answer);
        await this.playerService.updatePreferredCourtTypes(
            telegramId,
            courtTypes
        );

        return {
            message: this.getDistrictQuestion(),
            nextStep: "district",
        };
    }

    async processDistrictAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; nextStep: string }> {
        await this.playerService.updatePlayerDistrict(telegramId, answer);

        return {
            message: this.getAvailabilityQuestion(),
            nextStep: "availability",
        };
    }

    async processAvailabilityAnswer(
        telegramId: number,
        answer: string
    ): Promise<{ message: string; nextStep: string }> {
        const availability = this.parseAvailabilityAnswer(answer);
        await this.playerService.updateAvailability(telegramId, availability);

        return {
            message: this.getCompletionMessage(),
            nextStep: "completed",
        };
    }

    private parseLevelAnswer(answer: string): PlayerLevel {
        if (answer.includes("Новичок")) return PlayerLevel.BEGINNER;
        if (answer.includes("Любитель")) return PlayerLevel.INTERMEDIATE;
        if (answer.includes("Продвинутый")) return PlayerLevel.ADVANCED;
        if (answer.includes("Эксперт")) return PlayerLevel.EXPERT;
        return PlayerLevel.BEGINNER;
    }

    private parseExperienceAnswer(answer: string): number {
        if (answer.includes("меньше года")) return 0;
        if (answer.includes("1-3 года")) return 2;
        if (answer.includes("3-5 лет")) return 4;
        if (answer.includes("больше 5 лет")) return 6;
        return 0;
    }

    private parseRatingAnswer(answer: string): number {
        if (answer.includes("1000-1200")) return 1100;
        if (answer.includes("1200-1400")) return 1300;
        if (answer.includes("1400-1600")) return 1500;
        if (answer.includes("1600+")) return 1700;
        return 1000;
    }

    private parseCourtTypeAnswer(answer: string): string[] {
        const courtTypes: string[] = [];
        if (answer.includes("Хард")) courtTypes.push(CourtType.HARD);
        if (answer.includes("Грунт")) courtTypes.push(CourtType.CLAY);
        if (answer.includes("Трава")) courtTypes.push(CourtType.GRASS);
        if (answer.includes("Ковер")) courtTypes.push(CourtType.CARPET);
        return courtTypes.length > 0 ? courtTypes : [CourtType.HARD];
    }

    private parseAvailabilityAnswer(answer: string): string[] {
        // Простой парсинг доступности
        return ["weekends", "evenings"];
    }

    private getExperienceQuestion(): string {
        return `📚 Сколько лет вы играете в теннис?`;
    }

    private getExperienceOptions(): string[] {
        return [
            "🆕 Меньше года",
            "📖 1-3 года",
            "📚 3-5 лет",
            "🎓 Больше 5 лет",
        ];
    }

    private getRatingQuestion(): string {
        return `🏆 Какой у вас рейтинг в теннисе?`;
    }

    private getRatingOptions(): string[] {
        return [
            "🥉 1000-1200 (новичок)",
            "🥈 1200-1400 (любитель)",
            "🥇 1400-1600 (продвинутый)",
            "👑 1600+ (эксперт)",
        ];
    }

    private getCourtTypeQuestion(): string {
        return `🏟️ На каких кортах предпочитаете играть? (можно выбрать несколько)`;
    }

    private getCourtTypeOptions(): string[] {
        return ["🟢 Хард", "🟤 Грунт", "🌱 Трава", "🔴 Ковер"];
    }

    private getDistrictQuestion(): string {
        return `📍 В каком районе вы проживаете?\n\nОтправьте название района, например: "Центральный", "Западный", "Северный"`;
    }

    private getAvailabilityQuestion(): string {
        return `⏰ Когда вы обычно свободны для игры?\n\nОтправьте текстом, например: "по выходным", "по вечерам", "утром"`;
    }

    private getCompletionMessage(): string {
        return `✅ Отлично! Ваш профиль создан!\n\nТеперь вы можете:\n🎯 Искать соперников\n🏟️ Создавать запросы на игру\n📊 Просматривать статистику\n\nИспользуйте /help для списка команд.`;
    }
}
