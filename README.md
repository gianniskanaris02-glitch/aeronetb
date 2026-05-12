# AeroNetB Aerospace API

Supply Chain Management API for Aerospace Components

## Technology Stack

- FastAPI (Python 3.10+)
- PostgreSQL (Relational Database)
- MongoDB (Document Database)
- JWT Authentication
- RBAC (Role-Based Access Control)

## Installation

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 14+
- MongoDB 6+

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/aeronetb-backend.git
cd aeronetb-backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure
