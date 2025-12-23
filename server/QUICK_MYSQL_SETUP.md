# Быстрая настройка MySQL (5 минут)

## Вариант 1: Railway.app (БЕСПЛАТНО)

1. Зайди на https://railway.app
2. Войди через GitHub
3. Нажми "New Project" → "Provision MySQL"
4. Жди готовности базы (1-2 минуты)
5. Нажми на базу → "Connect" → "MySQL Connection String"
6. Скопируй строку подключения

## Вариант 2: PlanetScale (БЕСПЛАТНО)

1. Зайди на https://planetscale.com  
2. Создай базу "paradise_shop"
3. Создай ветку "main"
4. Получи строку подключения

## Настройка .env

Замени в .env файле:
```
DB_HOST=твой-хост
DB_PORT=порт
DB_USER=имя_пользователя
DB_PASSWORD=пароль
DB_NAME=имя_базы
```

## Создание таблиц

Выполни:
```bash
node setup_mysql_tables.js
```

## Запуск сервера

```bash
node server.js
```

Готово! Система работает с MySQL в облаке.
