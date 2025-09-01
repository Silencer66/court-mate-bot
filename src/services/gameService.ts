import { PrismaClient, Game, GameSignup } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateGameInput {
    creatorId: bigint;
    startsAt: Date;
    title?: string;
    description?: string;
    location?: string;
    maxPlayers?: number;
    photoFileId?: string;
    levelHint?: string;
}

export interface PublishInfo {
    channelChatId: bigint;
    channelMessageId: number;
}

export class GameService {
    async createGame(data: CreateGameInput): Promise<Game> {
        return prisma.game.create({
            data: {
                creatorId: data.creatorId,
                startsAt: data.startsAt,
                title: data.title,
                description: data.description,
                location: data.location,
                maxPlayers: data.maxPlayers,
                photoFileId: data.photoFileId,
                levelHint: data.levelHint,
            },
        });
    }

    async setPublishInfo(gameId: number, info: PublishInfo): Promise<Game> {
        return prisma.game.update({
            where: { id: gameId },
            data: {
                channelChatId: info.channelChatId,
                channelMessageId: info.channelMessageId,
            },
        });
    }

    async cancelGame(gameId: number): Promise<Game> {
        return prisma.game.update({
            where: { id: gameId },
            data: { isCancelled: true },
        });
    }

    async getActiveGames(now: Date = new Date()): Promise<Game[]> {
        return prisma.game.findMany({
            where: { isCancelled: false, startsAt: { gte: now } },
            orderBy: { startsAt: "asc" },
        });
    }

    async getGameById(gameId: number) {
        return prisma.game.findUnique({ where: { id: gameId } });
    }

    async getSignups(gameId: number) {
        return prisma.gameSignup.findMany({
            where: { gameId, status: "JOINED" },
            orderBy: { createdAt: "asc" },
        });
    }

    async getSignupsWithPlayers(gameId: number) {
        return prisma.gameSignup.findMany({
            where: { gameId, status: "JOINED" },
            orderBy: { createdAt: "asc" },
            include: { game: false },
        });
    }

    async joinGame(
        gameId: number,
        playerId: bigint
    ): Promise<{ joined: boolean; reason?: string; signup?: GameSignup }> {
        return await prisma.$transaction(async (tx) => {
            const game = await tx.game.findUnique({ where: { id: gameId } });
            if (!game || game.isCancelled) {
                return { joined: false, reason: "Игра недоступна" };
            }

            const currentCount = await tx.gameSignup.count({
                where: { gameId, status: "JOINED" },
            });
            if (
                typeof game.maxPlayers === "number" &&
                currentCount >= game.maxPlayers
            ) {
                return { joined: false, reason: "Свободных мест нет" };
            }

            const existing = await tx.gameSignup.findUnique({
                where: { gameId_playerId: { gameId, playerId } },
            });
            if (existing && existing.status === "JOINED") {
                return { joined: false, reason: "Вы уже записаны" };
            }

            const signup = await tx.gameSignup.upsert({
                where: { gameId_playerId: { gameId, playerId } },
                update: { status: "JOINED" },
                create: { gameId, playerId, status: "JOINED" },
            });

            return { joined: true, signup };
        });
    }

    async leaveGame(
        gameId: number,
        playerId: bigint
    ): Promise<{ left: boolean; reason?: string }> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.gameSignup.findUnique({
                where: { gameId_playerId: { gameId, playerId } },
            });
            if (!existing || existing.status !== "JOINED") {
                return { left: false, reason: "Вы не были записаны" };
            }

            await tx.gameSignup.update({
                where: { gameId_playerId: { gameId, playerId } },
                data: { status: "CANCELLED" },
            });
            return { left: true };
        });
    }

    async countJoined(gameId: number): Promise<number> {
        return prisma.gameSignup.count({ where: { gameId, status: "JOINED" } });
    }
}

export function formatGameShort(game: Game, joinedCount: number): string {
    const dt = new Date(game.startsAt);
    const date = dt.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
    const parts: string[] = [];
    parts.push(`🗓 ${date}`);
    if (game.location) parts.push(`📍 ${game.location}`);
    if (game.levelHint) parts.push(`🎚 ${game.levelHint}`);
    if (typeof game.maxPlayers === "number")
        parts.push(`👥 ${joinedCount}/${game.maxPlayers}`);
    return parts.join("\n");
}

export function formatGameFull(game: Game, joinedCount: number): string {
    const title = game.title ? `🎾 <b>${escape(game.title)}</b>\n` : "";
    const desc = game.description ? `\n${escape(game.description)}` : "";
    return `${title}${formatGameShort(game, joinedCount)}${desc}`.trim();
}

function escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
