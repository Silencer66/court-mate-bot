import 'dotenv/config';
import { Telegraf } from 'telegraf';

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  console.error('BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

const bot = new Telegraf(botToken);

bot.start((ctx) => {
  ctx.reply('🎾 Привет! Я CourtMate Bot. Готов найти соперника и корт!');
});

bot.hears(/ping|пинг/i, (ctx) => ctx.reply('pong'));

bot.launch().then(() => {
  console.log('Bot started');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


