import { Context } from "telegraf";
import { NTRP_QUESTIONS, calculateNTRPRating } from "../services/ntrpService";
import { PlayerService } from "../services/playerService";
import { MOSCOW_DISTRICTS } from "../constants/EnvVars";

const playerService = new PlayerService();

// Хранилище состояния опроса для каждого пользователя
const surveyStates = new Map<
    number,
    {
        currentQuestion: number;
        answers: Record<string, number>;
        completed: boolean;
    }
>();

// Обработчик для показа вопроса опроса
export async function handleNTRPSurveyQuestion(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    const callbackData =
        ctx.callbackQuery && "data" in ctx.callbackQuery
            ? ctx.callbackQuery.data
            : undefined;
    if (!callbackData) return;

    const questionIndex = parseInt(callbackData.split("_")[3] || "0");

    if (isNaN(questionIndex) || questionIndex >= NTRP_QUESTIONS.length) {
        return ctx.reply("Ошибка: неверный индекс вопроса");
    }

    // Инициализируем состояние опроса, если его нет
    if (!surveyStates.has(telegramId)) {
        surveyStates.set(telegramId, {
            currentQuestion: 0,
            answers: {},
            completed: false,
        });
    }

    const question = NTRP_QUESTIONS[questionIndex];
    if (!question) {
        return ctx.reply("Ошибка: вопрос не найден");
    }

    const message = `📝 Вопрос ${questionIndex + 1} из ${NTRP_QUESTIONS.length}

${question.question}`;

    const keyboard = {
        inline_keyboard: question.options.map((option) => [
            {
                text: option.text,
                callback_data: `ntrp_answer_${question.id}_${option.value}`,
            },
        ]),
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Обработчик для ответа на вопрос
export async function handleNTRPAnswer(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    const callbackData =
        ctx.callbackQuery && "data" in ctx.callbackQuery
            ? ctx.callbackQuery.data
            : undefined;
    if (!callbackData) return;

    const [, , questionId, answerValue] = callbackData.split("_");
    const answer = parseFloat(answerValue || "0");

    if (isNaN(answer)) {
        return ctx.reply("Ошибка: неверный формат ответа");
    }

    // Получаем текущее состояние опроса
    const surveyState = surveyStates.get(telegramId);
    if (!surveyState) {
        return ctx.reply(
            "Ошибка: состояние опроса не найдено. Начните заново."
        );
    }

    // Сохраняем ответ
    if (questionId) {
        surveyState.answers[questionId] = answer;
    }
    surveyState.currentQuestion++;

    // Проверяем, завершен ли опрос
    if (surveyState.currentQuestion >= NTRP_QUESTIONS.length) {
        return await completeNTRPSurvey(ctx, telegramId);
    }

    // Показываем следующий вопрос
    const nextQuestion = NTRP_QUESTIONS[surveyState.currentQuestion];
    if (!nextQuestion) {
        return ctx.reply("Ошибка: следующий вопрос не найден");
    }

    const message = `📝 Вопрос ${surveyState.currentQuestion + 1} из ${
        NTRP_QUESTIONS.length
    }

${nextQuestion.question}`;

    const keyboard = {
        inline_keyboard: nextQuestion.options.map((option) => [
            {
                text: option.text,
                callback_data: `ntrp_answer_${nextQuestion.id}_${option.value}`,
            },
        ]),
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Функция для создания клавиатуры выбора покрытий с текущим статусом
function createCourtTypeKeyboard(currentPreferredTypes: string[]) {
    const courtTypes = [
        { type: "HARD", text: "🏟️ Хард (Хард)", emoji: "🏟️" },
        { type: "CLAY", text: "🏟️ Грунт (CLAY)", emoji: "🏟️" },
        { type: "GRASS", text: "🏟️ Трава (GRASS)", emoji: "🏟️" },
    ];

    const keyboard = {
        inline_keyboard: [
            courtTypes.map((court) => ({
                text: currentPreferredTypes.includes(court.type)
                    ? `${court.emoji} ✅ ${court.text.split(" ")[1]}`
                    : court.text,
                callback_data: `court_type_${court.type}`,
            })),
            [
                {
                    text: "✅ Завершить выбор",
                    callback_data: "finish_court_selection",
                },
            ],
        ],
    };

    return keyboard;
}

// Завершение опроса и определение рейтинга
async function completeNTRPSurvey(ctx: Context, telegramId: number) {
    try {
        const surveyState = surveyStates.get(telegramId);
        if (!surveyState) {
            return ctx.reply("Ошибка: состояние опроса не найдено");
        }

        // Вычисляем NTRP рейтинг
        const ntrpRating = calculateNTRPRating(surveyState.answers);

        // Сохраняем рейтинг в базу данных
        await playerService.updatePlayerNTRP(BigInt(telegramId), {
            ntrp: ntrpRating,
        });

        // Очищаем состояние опроса
        surveyStates.delete(telegramId);

        const message = `🎉 Опрос завершен!

Ваш рейтинг NTRP: ${ntrpRating}

Теперь давайте определим ваши предпочтения по покрытиям кортов.
Выберите покрытия, на которых предпочитаете играть:`;

        const keyboard = createCourtTypeKeyboard([]);

        return ctx.reply(message, { reply_markup: keyboard });
    } catch (error) {
        console.error("Ошибка при завершении опроса:", error);
        return ctx.reply(
            "Произошла ошибка при завершении опроса. Попробуйте позже."
        );
    }
}

// Обработчик для выбора типа покрытия
export async function handleCourtTypeSelection(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    const callbackData =
        ctx.callbackQuery && "data" in ctx.callbackQuery
            ? ctx.callbackQuery.data
            : undefined;
    if (!callbackData) return;

    const courtType = callbackData.split("_")[2];
    if (!courtType) return;

    try {
        // Получаем текущие предпочтения пользователя
        const player = await playerService.getPlayerById(BigInt(telegramId));
        if (!player) {
            return ctx.reply("Ошибка: профиль пользователя не найден");
        }

        let newPreferredCourtTypes = [...(player.preferredCourtTypes || [])];

        // Проверяем, есть ли уже это покрытие в предпочтениях
        const courtTypeIndex = newPreferredCourtTypes.indexOf(courtType);

        if (courtTypeIndex !== -1) {
            // Если покрытие уже выбрано - убираем его
            newPreferredCourtTypes.splice(courtTypeIndex, 1);
            await playerService.updatePlayerCourtTypes(BigInt(telegramId), {
                preferredCourtTypes: newPreferredCourtTypes,
            });

            // Обновляем сообщение с новой клавиатурой
            const message = `🏟️ Выберите покрытия, на которых предпочитаете играть:

Текущие предпочтения: ${
                newPreferredCourtTypes.length > 0
                    ? newPreferredCourtTypes.join(", ")
                    : "не выбрано"
            }

Нажмите на покрытие еще раз, чтобы убрать его из предпочтений.`;

            const keyboard = createCourtTypeKeyboard(newPreferredCourtTypes);

            return ctx.editMessageText(message, { reply_markup: keyboard });
        } else {
            // Если покрытие не выбрано - добавляем его
            newPreferredCourtTypes.push(courtType);
            await playerService.updatePlayerCourtTypes(BigInt(telegramId), {
                preferredCourtTypes: newPreferredCourtTypes,
            });

            // Обновляем сообщение с новой клавиатурой
            const message = `🏟️ Выберите покрытия, на которых предпочитаете играть:

Текущие предпочтения: ${newPreferredCourtTypes.join(", ")}

Нажмите на покрытие еще раз, чтобы убрать его из предпочтений.`;

            const keyboard = createCourtTypeKeyboard(newPreferredCourtTypes);

            return ctx.editMessageText(message, { reply_markup: keyboard });
        }
    } catch (error) {
        console.error("Ошибка при сохранении покрытия:", error);
        return ctx.reply(
            "Произошла ошибка при сохранении покрытия. Попробуйте позже."
        );
    }
}

// Завершение выбора покрытий и переход к выбору района
export async function handleFinishCourtSelection(ctx: Context) {
    const message = `🏟️ Отлично! Теперь давайте определим район, в котором вы проживаете.

Выберите ваш район:`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: MOSCOW_DISTRICTS.CAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.CAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.SAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.SAO.code}`,
                },
            ],
            [
                {
                    text: MOSCOW_DISTRICTS.SVAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.SVAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.VAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.VAO.code}`,
                },
            ],
            [
                {
                    text: MOSCOW_DISTRICTS.YUVAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.YUVAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.YUAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.YUAO.code}`,
                },
            ],
            [
                {
                    text: MOSCOW_DISTRICTS.YUZAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.YUZAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.ZAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.ZAO.code}`,
                },
            ],
            [
                {
                    text: MOSCOW_DISTRICTS.SZAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.SZAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.ZELAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.ZELAO.code}`,
                },
            ],
            [
                {
                    text: MOSCOW_DISTRICTS.NAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.NAO.code}`,
                },
                {
                    text: MOSCOW_DISTRICTS.TAO.name,
                    callback_data: `district_${MOSCOW_DISTRICTS.TAO.code}`,
                },
            ],
        ],
    };

    return ctx.reply(message, { reply_markup: keyboard });
}

// Обработчик для выбора района
export async function handleDistrictSelection(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        return ctx.reply("Ошибка: не удалось получить ID пользователя");
    }

    const callbackData =
        ctx.callbackQuery && "data" in ctx.callbackQuery
            ? ctx.callbackQuery.data
            : undefined;
    if (!callbackData) return;

    const district = callbackData.split("_")[1] || "";

    try {
        // Сохраняем район в базу данных
        await playerService.updatePlayerDistrict(BigInt(telegramId), {
            district,
        });

        const message = `🎉 Отлично! Ваш профиль настроен.

Район: ${district}

Теперь вы можете использовать все возможности бота для поиска партнеров по игре!`;

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: "👥 Найти партнера",
                        callback_data: "find_partner",
                    },
                    {
                        text: "🔍 Поиск по району",
                        callback_data: "search_by_district",
                    },
                ],
                [
                    { text: "📊 Мой профиль", callback_data: "show_profile" },
                    { text: "⚙️ Настройки", callback_data: "settings" },
                ],
            ],
        };

        return ctx.reply(message, { reply_markup: keyboard });
    } catch (error) {
        console.error("Ошибка при сохранении района:", error);
        return ctx.reply(
            "Произошла ошибка при сохранении района. Попробуйте позже."
        );
    }
}
