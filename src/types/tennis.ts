// NTRP рейтинг система
export interface NTRPLevel {
    rating: number;
    description: string;
    skills: string[];
}

// Вопросы для определения NTRP рейтинга
export interface NTRPQuestion {
    id: string;
    question: string;
    options: {
        value: number;
        text: string;
        description?: string;
    }[];
}

// Состояние опроса
export interface SurveyState {
    currentQuestion: number;
    answers: Record<string, number>;
    completed: boolean;
}

// Типы покрытий кортов
export type CourtType = "HARD" | "CLAY" | "GRASS";

// Район Москвы
export type MoscowDistrict =
    | "ЦАО"
    | "САО"
    | "СВАО"
    | "ВАО"
    | "ЮВАО"
    | "ЮАО"
    | "ЮЗАО"
    | "ЗАО"
    | "СЗАО"
    | "ЗелАО"
    | "НАО"
    | "ТАО";
