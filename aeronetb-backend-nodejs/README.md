# AeroNetB Aerospace API

Supply Chain Management API for Aerospace Components built with Node.js and Express.

## Technology Stack

- Node.js 18+
- Express.js
- PostgreSQL (Relational Database)
- MongoDB (Document Database)
- JWT Authentication
- RBAC (Role-Based Access Control)

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14+
- MongoDB 6+

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/aeronetb-backend.git
cd aeronetb-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run the application:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Documentation

Base URL: `http://localhost:8000`

### Authentication
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Current user

### Suppliers
- GET `/api/suppliers` - List suppliers
- POST `/api/suppliers` - Create supplier
- GET `/api/suppliers/:id` - Get supplier details

### Parts
- GET `/api/parts` - List parts
- GET `/api/parts/:id/specifications` - Get specifications (MongoDB)

### Orders
- GET `/api/orders` - List orders
- POST `/api/orders` - Create order

### Quality
- GET `/api/quality/inspections` - List inspections
- POST `/api/quality/inspections` - Create inspection

### IoT
- GET `/api/iot/devices/:deviceId/readings` - Get sensor readings
- POST `/api/iot/sensors/readings` - Post sensor reading

### Alerts
- GET `/api/alerts` - List alerts
- GET `/api/alerts/active` - Get active alerts

### Dashboard
- GET `/api/dashboard/kpis` - Get KPIs
- GET `/api/dashboard/procurement` - Procurement dashboard

## Project Structure

```
aeronetb-backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── config.js
│   ├── database/        # Database connections
│   │   ├── postgresql.js
│   │   └── mongodb.js
│   ├── models/          # Data models (Pydantic-like schemas)
│   ├── routes/          # API endpoints
│   │   ├── auth.js
│   │   ├── suppliers.js
│   │   ├── parts.js
│   │   ├── orders.js
│   │   ├── quality.js
│   │   ├── iot.js
│   │   ├── alerts.js
│   │   └── dashboard.js
│   ├── middleware/      # Auth & RBAC
│   │   ├── auth.js
│   │   └── rbac.js
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   │   └── security.js
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── package.json
└── README.md
```

## Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Environment-based configuration
- CORS protection

## Roles

- Administrator
- Supply Chain Manager
- Procurement Officer
- Quality Inspector
- Quality Manager
- Warehouse Manager
- Equipment Engineer
- Auditor

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Run in production mode
npm start
```

## Testing

```bash
# Run tests
npm test
```

## Deployment

### Option 1: Railway.app
1. Create account on Railway.app
2. Connect GitHub repository
3. Add PostgreSQL and MongoDB services
4. Set environment variables
5. Deploy

### Option 2: Render.com
1. Create account on Render.com
2. Connect GitHub repository
3. Add PostgreSQL database
4. Connect MongoDB Atlas
5. Set environment variables
6. Deploy

### Option 3: Local
```bash
# Ensure PostgreSQL and MongoDB are running
npm start
```

## License

MIT License

## Contact

For questions or issues, please contact the development team.
