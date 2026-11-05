# ChibiLove 💕 ЧибиПара — Telegram Mini App для парочек

Уютное приложение для пар в Telegram (`@ChibiLovePara_bot`), где два человека связывают свои аккаунты, создают милых чиби-аватаров и ухаживают за моделькой друг друга.

## Структура проекта

- [`backend/server.py`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/backend/server.py) — Python-сервер (HTTP API + база данных SQLite `chibilove.db` + интеграция с Telegram Bot API `@ChibiLovePara_bot`).
- [`public/index.html`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/index.html) — Главная точка входа Telegram WebApp.
- [`public/css/styles.css`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/css/styles.css) — Нежная пастельная дизайн-система (7 пастельных тем, анимации частиц, адаптивная мобильная вёрстка).
- [`public/js/chibi-renderer.js`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/js/chibi-renderer.js) — Векторный SVG-движок чиби-аватаров (слои кожи, глаз, причёсок, одежды, эмоций, состояний голода/грязи/усталости, 14 аксессуаров и 4 парных поз).
- [`public/js/app.js`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/public/js/app.js) — Логика фронтенда, синхронизация с партнёром, переключение вида («Глазами партнёра») и управление состоянием.
- [`start_all.sh`](file:///Users/danil/.gemini/antigravity/scratch/chibilove-tma/start_all.sh) — Скрипт одновременного запуска сервера и публичного HTTPS-туннеля Cloudflare.

## Быстрый запуск

```bash
./start_all.sh
```
