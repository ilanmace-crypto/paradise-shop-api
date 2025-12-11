# Paradise Shop API

Backend API for Paradise Shop e-commerce platform.

## Deployment on Railway

1. Connect this repository to Railway
2. Railway will automatically detect Node.js application
3. Add PostgreSQL database service
4. Set `DATABASE_URL` environment variable (Railway does this automatically)
5. Deploy!

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `GET /api/categories` - Get all categories
- `POST /api/admin/login` - Admin login
- `POST /api/orders` - Create order

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 10000)
- `NODE_ENV` - Environment (production/development)
