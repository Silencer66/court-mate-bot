import { prisma } from "@/config/database";
import { PlayerLevel } from "@/types/tennis";
import type { Player } from "@prisma/client";

export class PlayerService {
    async createPlayer(
        telegramId: number,
        firstName: string,
        username?: string,
        lastName?: string,
        languageCode?: string,
        isBot: boolean = false,
        isPremium?: boolean,
        addedToAttachmentMenu?: boolean,
        allowsWriteToPm?: boolean
    ): Promise<Player> {
        return await prisma.player.create({
            data: {
                id: BigInt(telegramId),
                firstName,
                username,
                lastName,
                languageCode,
                isBot,
                isPremium,
                addedToAttachmentMenu,
                allowsWriteToPm,
                level: PlayerLevel.BEGINNER,
                experience: 0,
                rating: 1000,
                district: null,
                preferredCourtTypes: [],
                availability: [],
            },
        });
    }

    async getPlayerByTelegramId(telegramId: number): Promise<Player | null> {
        return await prisma.player.findUnique({
            where: { id: BigInt(telegramId) },
        });
    }

    async updatePlayerLevel(
        telegramId: number,
        level: PlayerLevel
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { level },
        });
    }

    async updatePlayerExperience(
        telegramId: number,
        experience: number
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { experience },
        });
    }

    async updatePlayerRating(
        telegramId: number,
        rating: number
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { rating },
        });
    }

    async updatePlayerDistrict(
        telegramId: number,
        district: string
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { district },
        });
    }

    async updatePreferredCourtTypes(
        telegramId: number,
        courtTypes: string[]
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { preferredCourtTypes: courtTypes },
        });
    }

    async updateAvailability(
        telegramId: number,
        availability: string[]
    ): Promise<Player> {
        return await prisma.player.update({
            where: { id: BigInt(telegramId) },
            data: { availability },
        });
    }

    async findPlayersByLevel(
        level: PlayerLevel,
        excludeTelegramId?: number
    ): Promise<Player[]> {
        return await prisma.player.findMany({
            where: {
                level,
                id: excludeTelegramId
                    ? { not: BigInt(excludeTelegramId) }
                    : undefined,
            },
            take: 10,
        });
    }

    async findPlayersByDistrict(
        district: string,
        excludeTelegramId?: number
    ): Promise<Player[]> {
        return await prisma.player.findMany({
            where: {
                district,
                id: excludeTelegramId
                    ? { not: BigInt(excludeTelegramId) }
                    : undefined,
            },
            take: 10,
        });
    }
}
