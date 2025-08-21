export enum PlayerLevel {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    EXPERT = "EXPERT",
}

export enum CourtType {
    HARD = "HARD",
    CLAY = "CLAY",
    GRASS = "GRASS",
    CARPET = "CARPET",
}

export interface PlayerProfile {
    id: bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    languageCode?: string;
    isBot: boolean;
    isPremium?: boolean;
    addedToAttachmentMenu?: boolean;
    allowsWriteToPm?: boolean;
    level: PlayerLevel;
    experience: number;
    rating: number;
    district?: string;
    preferredCourtTypes: CourtType[];
    availability: string[];
    createdAt: Date;
    updatedAt: Date;
}
