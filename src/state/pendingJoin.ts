// Простое хранилище намерения записаться в игру до завершения профиля

const pendingJoinByUser = new Map<number, number>(); // telegramId -> gameId

export function setPendingJoin(userId: number, gameId: number): void {
    pendingJoinByUser.set(userId, gameId);
}

export function getPendingJoin(userId: number): number | undefined {
    return pendingJoinByUser.get(userId);
}

export function consumePendingJoin(userId: number): number | undefined {
    const gameId = pendingJoinByUser.get(userId);
    if (gameId !== undefined) pendingJoinByUser.delete(userId);
    return gameId;
}

export function clearPendingJoin(userId: number): void {
    pendingJoinByUser.delete(userId);
}
