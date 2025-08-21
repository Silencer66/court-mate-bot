# 🎾 CourtMate Bot

Telegram бот для поиска соперников и кортов для игры в теннис.

## 🚀 Возможности

-   📝 Опрос для определения уровня игры
-   🏆 Система рейтинга игроков
-   📍 Указание района проживания
-   👥 Поиск соперников по уровню и району
-   🏟️ Управление предпочтениями по кортам
-   ⏰ Указание доступности для игры
-   📊 Расширенный профиль игрока
-   🔍 Сбор максимального количества данных из Telegram

## 🛠️ Технологии

-   **TypeScript** - типизированный JavaScript
-   **Telegraf** - фреймворк для Telegram ботов
-   **Prisma** - ORM для работы с базой данных
-   **PostgreSQL** - реляционная база данных
-   **esbuild** - быстрый бандлер
-   **nodemon** - автоматическая перезагрузка в dev-режиме

## 📋 Требования

-   Node.js 18+
-   PostgreSQL 12+
-   Telegram Bot Token

## 🔧 Установка

1. **Клонируйте репозиторий:**

```bash
git clone <your-repo-url>
cd court-mate-bot
```

2. **Установите зависимости:**

```bash
npm install
```

3. **Настройте переменные окружения:**

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL="postgresql://username:password@localhost:5432/court_mate_db"
```

4. **Настройте базу данных:**

```bash
# Создайте базу данных PostgreSQL
createdb court_mate_db

# Сгенерируйте Prisma клиент
npm run db:generate

# Примените схему к базе данных
npm run db:push
```

## 🚀 Запуск

### Разработка

```bash
npm run dev
```

### Продакшн

```bash
npm run build
npm start
```

## 📚 Команды бота

-   `/start` - Начать/перезапустить бота
-   `/help` - Показать справку
-   `/profile` - Показать ваш профиль
-   `/find` - Найти соперника
-   `/ping` - Проверить работу бота

## 🗄️ База данных

### Модели

-   **Player** - профиль игрока
-   **MatchRequest** - запросы на игру
-   **Match** - завершенные матчи

### Управление базой

```bash
# Генерация клиента Prisma
npm run db:generate

# Применение изменений схемы
npm run db:push

# Создание миграции
npm run db:migrate

# Открыть Prisma Studio
npm run db:studio
```

## 🏗️ Архитектура

```
src/
├── config/          # Конфигурация (БД, env)
├── services/        # Бизнес-логика
├── types/           # TypeScript типы
├── index.ts         # Точка входа
└── ...
```

## 🔄 Разработка

### Добавление новых команд

1. Создайте сервис в `src/services/`
2. Добавьте обработчик в `src/index.ts`
3. Обновите команду `/help`

### Изменение схемы БД

1. Отредактируйте `prisma/schema.prisma`
2. Запустите `npm run db:generate`
3. Примените изменения `npm run db:push`

## 📝 Лицензия

MIT
