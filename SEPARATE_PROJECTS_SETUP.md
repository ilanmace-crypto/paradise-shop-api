# 🔗 Соединение фронтенда и API (2 проекта на Vercel)

## 📋 Текущая ситуация:
- **Фронтенд**: `https://frontend-app.vercel.app/`
- **API**: `https://api-app.vercel.app/`
- **БД**: Supabase

## 🛠️ Что нужно сделать:

### 1. Настроить CORS в API
Добавь в API `server.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://frontend-app.vercel.app', 'https://your-frontend-url.vercel.app'],
  credentials: true
}));
```

### 2. Обновить Environment Variables в фронтенде
В настройках фронтенд проекта Vercel:
```
VITE_API_URL=https://your-api-url.vercel.app/api
```

### 3. Обновить Environment Variables в API
В настройках API проекта Vercel:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

## ✅ Как проверить работу:

### 1. Проверить API отдельно
```bash
curl https://your-api-url.vercel.app/health
curl https://your-api-url.vercel.app/api/products
```

### 2. Проверить фронтенд
Открой `https://your-frontend-url.vercel.app/` и проверь:
- Загружаются ли товары
- Работают ли запросы к API

### 3. Проверить в браузере
Открой DevTools → Network и посмотри:
- Запросы идут на правильный API URL
- Нет CORS ошибок
- Ответы приходят с данными

## 🔧 Если есть CORS ошибки:

### В API добавь:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
```

### Или более безопасный вариант:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-url.vercel.app'] 
    : ['http://localhost:5173'],
  credentials: true
}));
```

## 🚀 Автоматический деплой:

### Для фронтенда:
```bash
git push origin main  # в репозитории фронтенда
```

### Для API:
```bash
git push origin main  # в репозитории API
```

## 📝 Готовые URL для замены:
- Замени `your-api-url.vercel.app` на твой API URL
- Замени `your-frontend-url.vercel.app` на твой фронтенд URL

## 🎯 Итог:
- Фронтенд делает запросы на API через абсолютные URL
- API отвечает с правильными CORS заголовками
- База данных работает в Supabase
- Всё бесплатно! 🆓

---

**Готово! Твои 2 проекта работают вместе! 🎉**
