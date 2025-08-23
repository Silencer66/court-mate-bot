#!/bin/bash

echo "🚀 Запуск Court Mate Bot в режиме разработки..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "Скопируйте .env.example в .env и заполните необходимые переменные"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down

# Собираем и запускаем контейнеры
echo "🔨 Собираем и запускаем контейнеры..."
docker-compose up --build -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Применяем миграции Prisma
echo "🗄️ Применяем миграции базы данных..."
docker-compose exec app npx prisma db push

echo "✅ Court Mate Bot запущен!"
echo ""
echo "📱 Приложение доступно на: http://localhost:3000"
echo "🗄️ pgAdmin доступен на: http://localhost:5050"
echo "   Email: admin@courtmate.com"
echo "   Пароль: admin123"
echo ""
echo "📋 Полезные команды:"
echo "   docker-compose logs -f app     # Логи приложения"
echo "   docker-compose logs -f postgres # Логи базы данных"
echo "   docker-compose down            # Остановить все контейнеры"
echo "   docker-compose restart app     # Перезапустить приложение"
