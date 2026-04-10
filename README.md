# Smart Poultry Management System (SPMS) 🐔

A comprehensive, modern web application for managing poultry farms with real-time tracking, data analytics, and automated alerts.

![Phase 1 MVP](https://img.shields.io/badge/Phase-1%20MVP-green)
![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)

## Features (Phase 1 MVP) ✅

### Authentication & User Management
- JWT-based secure authentication
- User registration and login
- Protected routes
- Role-based access (admin, manager, staff)

### Dashboard 📊
- Real-time statistics cards
- Egg production trend charts (Line Chart)
- Low stock alerts
- Activity feed
- Quick action buttons

### Chicken Management 🐔
- Add/Edit/Delete batches
- Auto age calculation
- Status tracking (active/sold/retired)
- Mortality tracking
- Current quantity calculation

### Egg Production 🥚
- Daily egg recording
- Size tracking (small, medium, large, jumbo)
- Broken egg tracking
- Weekly overview calendar
- Production trends

### Feed Management 🌾
- Inventory tracking
- Low stock alerts
- Cost per unit tracking
- Total inventory value calculation
- Supplier information

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
Poultry mobile/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Batch.js
│   │   ├── EggRecord.js
│   │   └── Feed.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── batches.js
│   │   ├── eggs.js
│   │   └── feeds.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MobileNav.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Chickens.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Eggs.jsx
│   │   │   ├── Feeds.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/poultry_db
JWT_SECRET=your_super_secret_key_change_in_production
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or using MongoDB Compass
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 6. First Time Setup

1. Click "Sign Up" on the login page
2. Create your admin account
3. Login and start managing your poultry farm!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get single batch
- `POST /api/batches` - Create batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch
- `GET /api/batches/stats/summary` - Get statistics

### Eggs
- `GET /api/eggs` - Get all records
- `GET /api/eggs/today` - Get today's count
- `GET /api/eggs/trends/daily` - Get 30-day trends
- `POST /api/eggs` - Create record
- `PUT /api/eggs/:id` - Update record
- `DELETE /api/eggs/:id` - Delete record

### Feeds
- `GET /api/feeds` - Get all feeds
- `GET /api/feeds/alerts/low-stock` - Get low stock alerts
- `POST /api/feeds` - Create feed
- `PUT /api/feeds/:id` - Update feed
- `DELETE /api/feeds/:id` - Delete feed

## UI/UX Design

### Theme
- **Primary:** Green (#10b981) - Agriculture/poultry feel
- **Accent:** Yellow (#eab308) - Egg color
- **Background:** Light gray with glassmorphism effects

### Features
- Responsive design (mobile-first)
- Glassmorphism cards
- Smooth animations (Framer Motion)
- Bottom navigation for mobile
- Sidebar navigation for desktop
- Toast notifications
- Loading skeletons

## Development Roadmap

### Phase 1: MVP ✅ (Current)
- Login system
- Dashboard basic
- Chicken management
- Egg tracking
- Feed system

### Phase 2: Enhancement
- Medicine tracking
- Scheduling system
- Reports and exports
- PDF generation

### Phase 3: Advanced
- Real-time updates (Socket.io)
- Notifications
- AI insights
- Profit calculations
- Multi-user support

### Phase 4: Scale
- Mobile app (React Native)
- Cloud deployment
- SaaS features
- API integrations

## Demo Credentials

For testing:
```
Username: admin
Password: admin123
```

## Screenshots

*Coming soon - screenshots of key features*

## Contributing

This is a portfolio project. Feel free to fork and customize for your needs!

## License

MIT License - feel free to use for personal or commercial projects.

## Contact

Built with 💚 for the poultry farming community.

---

**Smart Poultry Management System v1.0.0**
