Write-Host "🚀 Запуск Court Mate Bot в продакшн режиме..." -ForegroundColor Green

# Проверяем наличие env/production.env файла
if (-not (Test-Path "env/production.env")) {
    Write-Host "❌ Файл env/production.env не найден!" -ForegroundColor Red
    Write-Host "Убедитесь, что у вас есть env/production.env с продакшен переменными" -ForegroundColor Yellow
    exit 1
}

# Останавливаем существующие контейнеры
Write-Host "🛑 Останавливаем существующие контейнеры..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

# Собираем и запускаем контейнеры
Write-Host "🔨 Собираем и запускаем контейнеры..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up --build -d

# Ждем запуска базы данных
Write-Host "⏳ Ждем запуска базы данных..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Применяем миграции Prisma
Write-Host "🗄️ Применяем миграции базы данных..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml exec app npx prisma db push

Write-Host "✅ Court Mate Bot запущен в продакшн режиме!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Приложение запущено в фоновом режиме" -ForegroundColor Cyan
Write-Host "🗄️ pgAdmin доступен на: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Полезные команды:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.prod.yml logs -f app     # Логи приложения" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml logs -f postgres # Логи базы данных" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml down            # Остановить все контейнеры" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml restart app     # Перезапустить приложение" -ForegroundColor White
