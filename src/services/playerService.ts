import { PrismaClient } from "@prisma/client";
import { validateNTRPRating } from "./ntrpService";

const prisma = new PrismaClient();

export interface CreatePlayerData {
    id: bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    languageCode?: string;
    isBot?: boolean;
    isPremium?: boolean;
    addedToAttachmentMenu?: boolean;
}

export interface UpdatePlayerNTRPData {
    ntrp: number;
}

export interface UpdatePlayerDistrictData {
    district: string;
}

export interface UpdatePlayerCourtTypesData {
    preferredCourtTypes: string[];
}

export class PlayerService {
    // Создание нового игрока
    async createPlayer(data: CreatePlayerData) {
        return await prisma.player.create({
            data: {
                id: data.id,
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                languageCode: data.languageCode,
                isBot: data.isBot || false,
                isPremium: data.isPremium,
                addedToAttachmentMenu: data.addedToAttachmentMenu,
            },
        });
    }

    // Получение игрока по ID
    async getPlayerById(id: bigint) {
        return await prisma.player.findUnique({
            where: { id },
        });
    }

    // Обновление NTRP рейтинга игрока
    async updatePlayerNTRP(id: bigint, data: UpdatePlayerNTRPData) {
        if (!validateNTRPRating(data.ntrp)) {
            throw new Error(
                "Некорректный NTRP рейтинг. Должен быть от 1.0 до 7.0 с шагом 0.5"
            );
        }

        return await prisma.player.update({
            where: { id },
            data: { ntrp: data.ntrp },
        });
    }

    // Обновление района проживания игрока
    async updatePlayerDistrict(id: bigint, data: UpdatePlayerDistrictData) {
        return await prisma.player.update({
            where: { id },
            data: { district: data.district },
        });
    }

    // Обновление предпочитаемых типов покрытий
    async updatePlayerCourtTypes(id: bigint, data: UpdatePlayerCourtTypesData) {
        return await prisma.player.update({
            where: { id },
            data: { preferredCourtTypes: data.preferredCourtTypes },
        });
    }

    // Получение всех игроков
    async getAllPlayers() {
        return await prisma.player.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    // Поиск игроков по району
    async getPlayersByDistrict(district: string) {
        return await prisma.player.findMany({
            where: { district },
            orderBy: { createdAt: "desc" },
        });
    }

    // Поиск игроков по NTRP рейтингу
    async getPlayersByNTRP(minRating: number, maxRating: number) {
        return await prisma.player.findMany({
            where: {
                ntrp: {
                    gte: minRating,
                    lte: maxRating,
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
}
