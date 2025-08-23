Write-Host "🚀 Запуск Court Mate Bot в режиме разработки..." -ForegroundColor Green

# Проверяем наличие .env файла
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
    Write-Host "Создайте .env файл в корне проекта с BOT_TOKEN" -ForegroundColor Yellow
    exit 1
}

# Останавливаем существующие контейнеры
Write-Host "🛑 Останавливаем существующие контейнеры..." -ForegroundColor Yellow
docker-compose down

# Собираем и запускаем контейнеры
Write-Host "🔨 Собираем и запускаем контейнеры..." -ForegroundColor Yellow
docker-compose up --build -d

# Ждем запуска базы данных
Write-Host "⏳ Ждем запуска базы данных..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Применяем миграции Prisma
Write-Host "🗄️ Применяем миграции базы данных..." -ForegroundColor Yellow
docker-compose exec app npx prisma db push

Write-Host "✅ Court Mate Bot запущен!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Приложение доступно на: http://localhost:8045" -ForegroundColor Cyan
Write-Host "🗄️ pgAdmin доступен на: http://localhost:5050" -ForegroundColor Cyan
Write-Host "   Email: admin@courtmate.com" -ForegroundColor White
Write-Host "   Пароль: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📋 Полезные команды:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f app     # Логи приложения" -ForegroundColor White
Write-Host "   docker-compose logs -f postgres # Логи базы данных" -ForegroundColor White
Write-Host "   docker-compose down            # Остановить все контейнеры" -ForegroundColor White
Write-Host "   docker-compose restart app     # Перезапустить приложение" -ForegroundColor White
