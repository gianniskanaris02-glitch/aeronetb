# AeroNetB Backend - Complete Setup Guide

## 📦 Step 1: Download and Extract Files

1. Download the `aeronetb-backend-nodejs.zip` file
2. Extract it to your desired location
3. Open terminal/command prompt in the extracted folder

## 🔧 Step 2: Install Node.js Dependencies

```bash
# Navigate to project directory
cd aeronetb-backend-nodejs

# Install all dependencies
npm install
```

This will install:
- express (web framework)
- pg (PostgreSQL driver)
- mongodb (MongoDB driver)
- jsonwebtoken (JWT authentication)
- bcryptjs (password hashing)
- dotenv (environment configuration)
- cors (cross-origin requests)
- nodemon (development auto-reload)

## 🗄️ Step 3: Setup Databases

### PostgreSQL Setup

**Option A: Local Installation**
```bash
# Install PostgreSQL 14+ from https://www.postgresql.org/download/

# Create database
psql -U postgres
CREATE DATABASE aeronetb_db;
CREATE USER aeronetb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aeronetb_db TO aeronetb_user;
\q
```

**Option B: Docker**
```bash
docker run --name postgres-aeronetb -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=aeronetb_db -p 5432:5432 -d postgres:14
```

### MongoDB Setup

**Option A: Local Installation**
```bash
# Install MongoDB 6+ from https://www.mongodb.com/try/download/community
# MongoDB will run on mongodb://localhost:27017
```

**Option B: Docker**
```bash
docker run --name mongo-aeronetb -p 27017:27017 -d mongo:6
```

**Option C: MongoDB Atlas (Free Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster
4. Get connection string (e.g., mongodb+srv://user:pass@cluster.mongodb.net/)

## ⚙️ Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
# Use your favorite text editor (nano, vim, VS Code, etc.)
nano .env
```

Update these values in `.env`:
```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=aeronetb_user
POSTGRES_PASSWORD=your_actual_password
POSTGRES_DB=aeronetb_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# JWT Secret (generate a secure random string)
JWT_SECRET=generate-a-secure-random-key-here
```

## 🚀 Step 5: Run the Server

```bash
# Development mode (auto-reload on changes)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ PostgreSQL connected: aeronetb_db
✅ MongoDB connected: aeronetb_mongo
🚀 AeroNetB Aerospace API Server
📡 Server running on: http://0.0.0.0:8000
```

## ✅ Step 6: Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-13T..."
}
```

## 🔐 Step 7: Test Authentication (After Database Setup)

You'll need to create a test user in your PostgreSQL database first:

```sql
-- Connect to database
psql -U aeronetb_user -d aeronetb_db

-- Create roles table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    access_level INTEGER NOT NULL
);

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a role
INSERT INTO roles (role_name, access_level) VALUES ('Administrator', 10);

-- Insert a test user (password: 'password123')
-- Hash generated with bcrypt for 'password123'
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id)
VALUES ('admin', 'admin@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 1);
```

Then test login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

## 📂 Step 8: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AeroNetB Node.js API"

# Create repository on GitHub.com
# Then connect and push:
git remote add origin https://github.com/YOUR-USERNAME/aeronetb-backend.git
git branch -M main
git push -u origin main
```

## 🐳 Docker Setup (Optional)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: aeronetb_db
      POSTGRES_USER: aeronetb_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  api:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - mongodb
    environment:
      - POSTGRES_HOST=postgres
      - MONGODB_URI=mongodb://mongodb:27017

volumes:
  postgres_data:
  mongo_data:
```

Run with:
```bash
docker-compose up -d
```

## 🔍 Troubleshooting

### Database Connection Issues

**PostgreSQL:**
```bash
# Check if PostgreSQL is running
# Windows: services.msc → look for PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Test connection
psql -U aeronetb_user -d aeronetb_db -h localhost
```

**MongoDB:**
```bash
# Check if MongoDB is running
# Windows: services.msc → look for MongoDB
# Mac: brew services list
# Linux: sudo systemctl status mongod

# Test connection
mongosh mongodb://localhost:27017
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=8001
```

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Create Database Schema**: Run DDL scripts to create tables
2. **Add More Routes**: Implement parts, orders, inventory, quality, alerts, dashboard routes
3. **Add Frontend**: Create dashboard with HTML/CSS/JavaScript or React
4. **Deploy**: Use Railway.app, Render.com, or other hosting

## 🆘 Getting Help

- Check console logs for error messages
- Verify environment variables in `.env`
- Ensure databases are running
- Test database connections separately
- Check firewall/port settings

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] MongoDB running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Database connections work
- [ ] Can create test user
- [ ] Login endpoint works
- [ ] Pushed to GitHub

---

**You're all set!** 🎉

The backend is now ready for development. Start adding more routes and building the dashboard frontend.
