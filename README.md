# Blood & Control — Real-time RP Server

Живая комната для совместной ролевой игры:  
**Ты** — Арата Люцифуг (генерал Цинь)  
**Я / второй человек** — Макима

## Быстрый запуск локально

```bash
cd server
npm install
npm start
```

Открыть: http://localhost:3000

## Деплой (бесплатно)

### Вариант 1 — Railway (самый простой)

1. Зайди на [railway.app](https://railway.app) и войди через GitHub
2. New Project → Deploy from GitHub repo (или загрузи папку)
3. Укажи Root Directory = `server`
4. Railway сам подхватит `package.json` и запустит
5. После деплоя появится публичный URL (типа `https://blood-and-control-production.up.railway.app`)

### Вариант 2 — Render

1. [render.com](https://render.com) → New → Web Service
2. Подключи репозиторий или загрузи
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`

### Вариант 3 — Fly.io / Glitch / другие

Аналогично — Node.js приложение.

## Как играть

1. Один человек создаёт комнату (оставляет код пустым) → получает код комнаты
2. Скидывает код второму
3. Второй выбирает роль «Макима» и вводит код
4. Пишете сообщения — они появляются у обоих в реальном времени

## Структура

```
blood-and-control-server/
├── server/
│   ├── index.js          # Socket.io сервер + комнаты
│   └── package.json
├── public/
│   ├── index.html        # Клиент
│   └── assets/           # Портреты и фон
└── README.md
```
