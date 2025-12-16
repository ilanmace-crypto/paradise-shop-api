# Деплой на Northflank - Пошаговая инструкция

## Шаг 1: Регистрация на Northflank
1. Зайди на https://northflank.com
2. Нажми "Sign Up" → "Create account"
3. Войди через GitHub или email
4. Подтверди email

## Шаг 2: Создание проекта
1. В dashboard нажми "Create Project"
2. **Project name**: `paradise-shop`
3. **Description**: `PARADISE_SHOP - Интернет магазин`
4. Нажми "Create Project"

## Шаг 3: Создание Docker сервиса
1. Внутри проекта нажми "Add Service" → "Docker Service"
2. **Service name**: `paradise-shop-app`
3. **Description**: `Backend + Frontend with SQLite`

## Шаг 4: Настройка Docker сервиса
### Repository:
- **Git provider**: GitHub
- **Repository**: `ilanmace-crypto/paradise-shop`
- **Branch**: `main`
- **Root directory**: оставь пустым

### Build:
- **Dockerfile path**: `Dockerfile`
- **Build context**: оставь пустым
- **Build command**: оставь пустым (используется Dockerfile)

### Resources:
- **CPU**: `0.1 vCPU` (бесплатно)
- **Memory**: `256 MB` (бесплатно)
- **Storage**: `1 GB` (бесплатно)

### Ports:
- **Internal port**: `3000`
- **External port**: `3000`
- **Protocol**: `HTTP`

## Шаг 5: Переменные окружения
1. Перейди в "Environment Variables"
2. Добавь:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

## Шаг 6: Деплой
1. Нажми "Create Service"
2. Northflank автоматически соберет Docker образ
3. Сервис запустится через 2-5 минут

## Шаг 7: Проверка работы
1. Сервис будет доступен по адресу: `https://paradise-shop-app.project-name.onnorthflank.com`
2. Проверь API: `https://domain.com/api/health`
3. Проверь товары: `https://domain.com/api/products`
4. Открой фронтенд: `https://domain.com`

## Преимущества Northflank:
- **750 часов/месяц бесплатно**
- **Настоящий Docker хостинг**
- **SQLite работает идеально**
- **Никогда не спит**
- **Стабильный домен**
- **Автодеплой с GitHub**

## Ограничения:
- **750 часов/месяц** (хватит для 24/7 работы)
- **256 MB памяти** (может быть мало для больших проектов)
- **0.1 vCPU** (ограниченная производительность)

## Если что-то не работает:
1. **Проверь логи**: В сервисе → "Logs"
2. **Пересобери**: Нажми "Redeploy"
3. **Проверь переменные окружения**
4. **Убедись что Dockerfile правильный**

## Мониторинг:
- **Usage**: отслеживай потребление часов
- **Logs**: проверяй логи ошибок
- **Metrics**: следи за CPU и памятью

## Готово!
Твой проект будет работать на настоящем Docker хостинге с SQLite 24/7!

## Дополнительные возможности:
- **Custom domain** (платно)
- **More resources** (платно)
- **Database addons** (платно)
- **CI/CD pipelines** (платно)
