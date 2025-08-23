# Docker для Court Mate Bot

Этот документ описывает, как использовать Docker для запуска Court Mate Bot.

## Что такое Docker?

**Docker** - это платформа для разработки, доставки и запуска приложений в контейнерах. Контейнер - это изолированная среда, которая содержит все необходимое для работы приложения.

### Основные понятия:

-   **Dockerfile** - инструкция по созданию образа
-   **Docker Image** - шаблон для создания контейнеров
-   **Docker Container** - запущенный экземпляр образа
-   **Docker Compose** - инструмент для управления несколькими контейнерами

## Структура проекта

```
court-mate-bot/
├── Dockerfile                 # Инструкции для создания образа приложения
├── docker-compose.yml         # Конфигурация для локальной разработки
├── docker-compose.prod.yml    # Конфигурация для продакшна
├── .dockerignore             # Файлы, исключаемые из Docker образа
├── .env                      # Переменные для Docker Compose (BOT_TOKEN)
├── env/                      # Переменные окружения для приложения
│   ├── development.env       # Переменные для разработки
│   └── production.env        # Переменные для продакшна
├── scripts/
│   ├── docker-dev.sh         # Скрипт запуска для Linux/Mac
│   ├── docker-dev.ps1        # Скрипт запуска для Windows
│   └── docker-prod.ps1       # Скрипт запуска для продакшна
└── DOCKER.md                 # Этот файл
```

## Быстрый старт

### 1. Установка Docker

Убедитесь, что у вас установлен Docker и Docker Compose:

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) для Windows/Mac
-   [Docker Engine](https://docs.docker.com/engine/install/) для Linux

### 2. Настройка переменных окружения

У вас уже есть настроенные файлы в папке `env/`:

-   `env/development.env` - для локальной разработки
-   `env/production.env` - для продакшна

Файл `.env` в корне проекта нужен только для Docker Compose и содержит:

```
BOT_TOKEN=your_telegram_bot_token_here
```

### 3. Запуск в режиме разработки

#### Windows (PowerShell):

```powershell
.\scripts\docker-dev.ps1
```

#### Linux/Mac:

```bash
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh
```

#### Ручной запуск:

```bash
# Сборка и запуск
docker-compose up --build -d

# Применение миграций базы данных
docker-compose exec app npx prisma db push
```

## Доступные сервисы

После запуска будут доступны:

-   **Приложение**: http://localhost:8045
-   **pgAdmin**: http://localhost:5050
    -   Email: admin@courtmate.com
    -   Пароль: admin123

## Полезные команды Docker

### Управление контейнерами:

```bash
# Посмотреть статус контейнеров
docker-compose ps

# Посмотреть логи приложения
docker-compose logs -f app

# Посмотреть логи базы данных
docker-compose logs -f postgres

# Остановить все контейнеры
docker-compose down

# Перезапустить приложение
docker-compose restart app

# Пересобрать и запустить
docker-compose up --build -d
```

### Работа с базой данных:

```bash
# Подключиться к базе данных
docker-compose exec postgres psql -U court_mate_user -d court_mate_db

# Применить миграции
docker-compose exec app npx prisma db push

# Сбросить базу данных
docker-compose exec app npx prisma db push --force-reset
```

### Отладка:

```bash
# Войти в контейнер приложения
docker-compose exec app sh

# Войти в контейнер базы данных
docker-compose exec postgres sh

# Посмотреть использование ресурсов
docker stats
```

## Развертывание в Yandex Cloud

### 1. Подготовка к продакшену

У вас уже есть `env/production.env` с продакшен переменными.

### 2. Запуск продакшен версии

```bash
# Запуск с продакшен конфигурацией
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down
```

### 3. Настройка в Yandex Cloud

1. **Создайте виртуальную машину** с Ubuntu/Debian
2. **Установите Docker** на VM
3. **Скопируйте файлы проекта** на VM
4. **Настройте firewall** для портов 5050 (pgAdmin)
5. **Запустите контейнеры** с продакшен конфигурацией

## Безопасность

### В продакшне:

-   Измените пароли по умолчанию
-   Используйте HTTPS для pgAdmin
-   Ограничьте доступ к pgAdmin по IP
-   Регулярно обновляйте образы Docker
-   Не открывайте порт 5432 (PostgreSQL) наружу

### Переменные окружения:

-   Никогда не коммитьте `.env` файлы в Git
-   Используйте сложные пароли
-   Разные пароли для разных окружений

## Troubleshooting

### Проблемы с подключением к базе данных:

```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи PostgreSQL
docker-compose logs postgres

# Проверьте переменные окружения
docker-compose exec app env | grep DATABASE
```

### Проблемы с приложением:

```bash
# Проверьте логи приложения
docker-compose logs app

# Перезапустите приложение
docker-compose restart app

# Проверьте переменные окружения
docker-compose exec app env | grep BOT_TOKEN
```

### Проблемы с pgAdmin:

```bash
# Проверьте логи pgAdmin
docker-compose logs pgadmin

# Перезапустите pgAdmin
docker-compose restart pgadmin
```

## Дополнительные ресурсы

-   [Docker Documentation](https://docs.docker.com/)
-   [Docker Compose Documentation](https://docs.docker.com/compose/)
-   [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
-   [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4/)
-   [Node.js Docker Image](https://hub.docker.com/_/node)
