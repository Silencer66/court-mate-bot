# Court Mate Bot

Telegram бот для поиска партнеров по теннису в Москве.

## Технологии

-   **Node.js** + **TypeScript**
-   **Telegraf** - фреймворк для Telegram ботов
-   **Prisma** - ORM для работы с базой данных
-   **PostgreSQL** - база данных
-   **Docker** - контейнеризация

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/court-mate-bot.git
cd court-mate-bot
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

У вас уже есть настроенные файлы в папке `env/`:

-   `env/development.env` - для локальной разработки
-   `env/production.env` - для продакшна

Создайте файл `.env` в корне проекта для Docker Compose:

```bash
# Содержимое .env
BOT_TOKEN=your_telegram_bot_token_here
```

### 4. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций (разработка)
npm run db:push

# Применение миграций (продакшен)
npm run db:push-prod
```

### 5. Запуск

#### Локальная разработка:

```bash
npm run dev
```

#### Продакшен:

```bash
npm run build
npm start
```

## Docker

### Локальная разработка:

```bash
# Windows
.\scripts\docker-dev.ps1

# Linux/Mac
./scripts/docker-dev.sh
```

### Продакшен:

```bash
# Windows
.\scripts\docker-prod.ps1

# Linux/Mac
./scripts/docker-prod.sh
```

## Структура проекта

```
court-mate-bot/
├── src/                    # Исходный код
│   ├── config/            # Конфигурация
│   ├── constants/         # Константы
│   ├── handlers/          # Обработчики команд
│   ├── routes/            # Маршруты бота
│   ├── services/          # Бизнес-логика
│   └── types/             # TypeScript типы
├── prisma/                # Схема базы данных
├── env/                   # Переменные окружения
│   ├── development.env    # Разработка
│   └── production.env     # Продакшен
├── scripts/               # Скрипты для Docker
├── Dockerfile             # Docker образ
├── docker-compose.yml     # Docker Compose (разработка)
└── docker-compose.prod.yml # Docker Compose (продакшен)
```

## Команды

-   `/start` - Начать работу с ботом
-   `/help` - Показать справку
-   `/profile` - Показать профиль

## Особенности

-   **NTRP рейтинг** - международная система оценки уровня игры
-   **Опрос для определения рейтинга** - автоматический расчет на основе ответов
-   **Выбор покрытий кортов** - грунт, трава, хард
-   **Районы Москвы** - 12 основных административных округов
-   **Поиск партнеров** - по рейтингу, району и предпочтениям

## Развертывание

Подробные инструкции по развертыванию в Yandex Cloud смотрите в [DOCKER.md](DOCKER.md).

## Лицензия

MIT
