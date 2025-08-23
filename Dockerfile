# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (включая dev зависимости для сборки)
RUN npm ci

# Копируем исходный код приложения
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Устанавливаем dotenv-cli глобально для продакшна
RUN npm install -g dotenv-cli

# Удаляем dev зависимости после сборки
RUN npm prune --production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Открываем порт (будет переопределен в docker-compose)
EXPOSE 8045

# Команда запуска (будет переопределена в docker-compose)
CMD ["npm", "run", "start-dev"]
