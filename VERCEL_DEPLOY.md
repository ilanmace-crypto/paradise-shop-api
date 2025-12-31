# 🚀 Vercel Deploy Guide - Paradise Shop

## 📋 Что нужно сделать:

### 1. Получить DATABASE_URL из Supabase
1. Зайди в Supabase → Settings → Database
2. Скопируй "Connection string"
3. Замени `[YOUR-PASSWORD]` на твой пароль
4. Пример: `postgresql://postgres:password@project.supabase.co:5432/postgres`

### 2. Деплой на Vercel

#### Способ 1: Через GitHub (рекомендуется)
1. Зайди на [vercel.com](https://vercel.com)
2. Войди через GitHub
3. Нажми "New Project"
4. Выбери репозиторий `paradise-shop-api`
5. Нажми "Import"

#### Способ 2: Через Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 3. Настройка Environment Variables в Vercel
В настройках проекта Vercel → Environment Variables добавь:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### 4. Деплой
- Нажми "Deploy" в Vercel
- Дождись завершения (2-3 минуты)

## ✅ Проверка работы

После деплоя проверь:
- `https://your-app.vercel.app/health` - Health check
- `https://your-app.vercel.app/api/products` - Товары
- `https://your-app.vercel.app/` - Фронтенд

## 🔄 Автоматический деплой

Vercel автоматически деплоит при пуше в GitHub:
```bash
git add .
git commit -m "Update for Vercel deploy"
git push origin main
```

## 💰 Стоимость Vercel
- **Hobby**: $0/мес
  - 100GB bandwidth
  - Unlimited static deployments
  - Serverless functions

**Итого с Supabase: $0 в месяц!** 🆓

## 🚨 Возможные проблемы

### 1. Ошибка подключения к БД
- Проверь `DATABASE_URL` в Environment Variables
- Убедись, что пароль правильный
- Проверь, что Supabase проект активен

### 2. Build error
- Проверь `package.json` в server/
- Убедись, что все зависимости установлены

### 3. Routes не работают
- Проверь `vercel.json` конфигурацию
- Убедись, что пути правильные

## 📞 Поддержка
- Vercel docs: vercel.com/docs
- Supabase docs: supabase.com/docs

---

**Готово! Твой проект теперь на Vercel + Supabase! 🎉**
