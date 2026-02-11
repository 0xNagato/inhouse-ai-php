# PRIMA AI - Restaurant Booking Agent

A sophisticated AI-powered restaurant booking system combining Node.js/TypeScript function-calling agents with Laravel backend and a responsive web widget.

## 🏗️ Architecture

```
prima-ai/
├── agent-service/          # Node.js/TypeScript AI agent with OpenAI integration
├── laravel/               # PHP Laravel API backend
├── db/                    # Database views and indexes for AI optimization
├── web-widget/            # Standalone HTML/CSS/JS chat widget
├── nginx/                 # Reverse proxy configuration (created by setup)
├── docker-compose.yml     # Service orchestration
└── setup.sh              # Automated setup script
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key
- Git

### Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd prima-ai
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Follow the prompts to configure your environment variables**

4. **Access the services:**
   - 🌐 **Main Application**: http://localhost
   - 🤖 **Agent API**: http://localhost/api/agent/
   - 🐘 **Laravel API**: http://localhost/api/
   - 🎨 **Web Widget**: http://localhost/widget/
   - 🗄️ **pgAdmin**: http://localhost:5050

## 🧠 AI Agent Service

The core TypeScript service powered by OpenAI GPT-4 with function calling capabilities:

### Features

- **Smart Function Routing**: Automatically routes user requests to appropriate tools
- **Role-Based Permissions**: Different access levels (customer, staff, admin)
- **Data Redaction**: Protects sensitive information based on user roles
- **Rate Limiting**: Prevents API abuse
- **Comprehensive Logging**: Winston-based logging with multiple levels

### Available Functions

1. **🔍 Search Venues**: Find restaurants by location, cuisine, or features
2. **📅 Check Availability**: Real-time availability checking
3. **📝 Make Bookings**: Create and manage reservations
4. **📊 Analytics**: Business insights and metrics (admin only)
5. **👥 User Management**: User operations and preferences

### API Endpoints

```
POST /chat                 # Main chat interface
GET  /health              # Health check
POST /function-call       # Direct function calling
```

## 🐘 Laravel Backend

PHP Laravel application providing robust API endpoints:

### Features

- **RESTful API Design**: Clean, consistent API structure
- **Authentication**: Laravel Sanctum for secure API access
- **Rate Limiting**: Built-in request throttling
- **Validation**: Comprehensive input validation
- **Error Handling**: Standardized error responses

### API Endpoints

```
GET    /api/venues              # List venues
GET    /api/venues/{id}         # Get venue details
POST   /api/venues/search       # Search venues
GET    /api/venues/{id}/availability  # Check availability
POST   /api/bookings           # Create booking
GET    /api/bookings/{id}      # Get booking details
GET    /api/analytics          # Business analytics
GET    /api/users              # User management
```

## 🗄️ Database Optimization

Optimized PostgreSQL views and indexes for AI-powered queries:

### AI-Optimized Views

- **`ai_venue_availability`**: Real-time availability with smart defaults
- **`analytics_summary`**: Pre-aggregated business metrics
- **`popular_venues`**: Trending restaurants and recommendations

### Performance Indexes

- Composite indexes for common query patterns
- Partial indexes for active records
- JSON indexes for flexible data structures

## 🎨 Web Widget

Responsive, embeddable chat widget for any website:

### Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Chat**: Instant messaging with typing indicators
- **Role-Based UI**: Different interfaces for different user types
- **Customizable**: Easy theming and configuration
- **Accessibility**: WCAG compliant with keyboard navigation

### Integration

```html
<!-- Include the widget -->
<iframe src="/widget/agent-widget.html" 
        width="400" height="600" 
        frameborder="0">
</iframe>

<!-- Or embed directly -->
<script>
// Configure and load the widget
const widgetConfig = {
    apiEndpoint: '/api/agent/chat',
    userRole: 'customer',
    theme: 'light'
};
</script>
```

## 🐳 Docker Deployment

### Development Mode

```bash
# Start all services
docker-compose up -d

# With development tools (pgAdmin, etc.)
docker-compose --profile development up -d

# View logs
docker-compose logs -f agent-service
```

### Production Mode

```bash
# Build and start production services
docker-compose up -d

# With monitoring (optional)
docker-compose --profile monitoring up -d
```

### Service Architecture

- **Nginx**: Reverse proxy and static file serving
- **Agent Service**: Node.js TypeScript application
- **Laravel App**: PHP-FPM with built-in web server
- **PostgreSQL**: Primary database with optimized schemas
- **Redis**: Caching and session storage
- **pgAdmin**: Database administration (development)
- **Grafana/Prometheus**: Monitoring and metrics (optional)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Laravel Configuration
LARAVEL_APP_KEY=base64:your_laravel_app_key_here
LARAVEL_API_TOKEN=your_laravel_api_token_here

# Database Configuration
DB_PASSWORD=your_secure_database_password

# Admin Passwords
PGADMIN_PASSWORD=your_pgadmin_password
GRAFANA_PASSWORD=your_grafana_password
```

## 🔧 Development

### Local Development

1. **Agent Service**:
   ```bash
   cd agent-service
   npm install
   npm run dev
   ```

2. **Laravel**:
   ```bash
   cd laravel
   composer install
   php artisan serve
   ```

3. **Database**:
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres
   
   # Run migrations (if Laravel app exists)
   cd laravel && php artisan migrate
   ```

### Testing

```bash
# Agent Service tests
cd agent-service && npm test

# Laravel tests (if implemented)
cd laravel && php artisan test

# Integration tests
docker-compose exec agent-service npm run test:integration
```

## 📋 Project Structure

### Agent Service (`agent-service/`)

```
agent-service/
├── src/
│   ├── config/           # Configuration files
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── tools/            # AI function tools
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── package.json          # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
└── Dockerfile           # Container build instructions
```

### Laravel Backend (`laravel/`)

```
laravel/
├── app/Http/Controllers/ # API controllers
├── routes/api.php       # API route definitions
├── composer.json        # PHP dependencies
└── Dockerfile           # Container build instructions
```

### Database (`db/`)

```
db/
├── views.sql            # AI-optimized database views
└── indexes.sql          # Performance indexes
```

### Web Widget (`web-widget/`)

```
web-widget/
└── agent-widget.html    # Complete chat widget
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **Data Redaction**: Role-based information filtering
- **Secure Headers**: OWASP recommended security headers
- **Authentication**: Token-based API authentication
- **CORS Configuration**: Secure cross-origin requests

## 🚀 Deployment

### Quick Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your values

# 2. Run setup
./setup.sh

# 3. Verify deployment
curl http://localhost/health
```

### Cloud Deployment

The system is designed to work with major cloud providers:

- **AWS**: ECS, RDS, ElastiCache
- **Google Cloud**: Cloud Run, Cloud SQL, Memorystore
- **Azure**: Container Instances, Database for PostgreSQL, Cache for Redis

## 📝 API Examples

### Chat with AI Agent

```bash
curl -X POST http://localhost/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find Italian restaurants near downtown",
    "userId": "user123",
    "sessionId": "session456"
  }'
```

### Search Venues (Laravel API)

```bash
curl -X GET "http://localhost/api/venues/search?query=italian&location=downtown" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Availability

```bash
curl -X GET "http://localhost/api/venues/123/availability?date=2024-01-15&party_size=4" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Docker not starting**: Ensure Docker Desktop is running
2. **Port conflicts**: Check if ports 80, 3001, 8000, 5432 are available
3. **OpenAI API errors**: Verify your API key is valid and has credits
4. **Permission errors**: Run `chmod +x setup.sh` to make setup executable

### Getting Help

- **Logs**: `docker-compose logs -f [service-name]`
- **Status**: `docker-compose ps`
- **Restart**: `docker-compose restart [service-name]`

## 🔄 Current Status

### ✅ Completed Components

- **Agent Service**: Complete TypeScript service with OpenAI integration
- **Laravel Integration**: API controllers and routes
- **Database Optimization**: Views and indexes for AI queries
- **Web Widget**: Responsive chat interface
- **Docker Composition**: Full service orchestration
- **Setup Automation**: One-command deployment
- **Documentation**: Comprehensive README and inline docs

### 🚧 Future Enhancements

- Authentication integration
- Real venue data integration
- Advanced analytics dashboard
- Mobile app support
- Multi-language support

---

**Built with ❤️ for intelligent restaurant booking experiences**

Ready to deploy with `./setup.sh`!
