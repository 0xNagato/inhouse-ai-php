#!/bin/bash

# PRIMA AI Setup Script
# This script helps you set up the PRIMA AI repository

set -e

echo "🚀 PRIMA AI Setup"
echo "=================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Create environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Created .env file from template. Please edit it with your actual values."
        print_warning "Required variables:"
        echo "  - OPENAI_API_KEY: Your OpenAI API key"
        echo "  - LARAVEL_APP_KEY: Laravel application key"
        echo "  - LARAVEL_API_TOKEN: API token for Laravel"
        echo "  - DB_PASSWORD: Secure database password"
        echo "  - PGADMIN_PASSWORD: pgAdmin password"
        echo "  - GRAFANA_PASSWORD: Grafana password"
        echo ""
        print_warning "Please edit the .env file before continuing."
        read -p "Press Enter when you've updated the .env file..."
    else
        print_success "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=(
        "logs"
        "storage"
        "nginx/sites"
        "ssl"
        "monitoring"
        "db/init"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    done
}

# Generate Laravel app key if needed
generate_laravel_key() {
    print_status "Checking Laravel application key..."
    
    if [ -f .env ]; then
        if grep -q "LARAVEL_APP_KEY=your_laravel_app_key_here" .env; then
            print_warning "Generating Laravel application key..."
            # Generate a random key
            laravel_key="base64:$(openssl rand -base64 32)"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|LARAVEL_APP_KEY=your_laravel_app_key_here|LARAVEL_APP_KEY=$laravel_key|" .env
            else
                # Linux
                sed -i "s|LARAVEL_APP_KEY=your_laravel_app_key_here|LARAVEL_APP_KEY=$laravel_key|" .env
            fi
            print_success "Generated Laravel application key"
        fi
    fi
}

# Create Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    cat > nginx/nginx.conf << 'NGINX_CONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    include /etc/nginx/conf.d/*.conf;
}
NGINX_CONF

    cat > nginx/sites/default.conf << 'NGINX_SITE'
# Agent Service Proxy
upstream agent_service {
    server agent-service:3001;
}

# Laravel Application Proxy
upstream laravel_app {
    server laravel-app:8000;
}

server {
    listen 80;
    server_name localhost;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Agent Service API
    location /api/agent/ {
        proxy_pass http://agent_service/\;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Laravel Application API
    location /api/ {
        proxy_pass http://laravel_app/api/\;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Web Widget
    location /widget/ {
        alias /var/www/html/widget/;
        try_files $uri $uri/ =404;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_SITE

    print_success "Nginx configuration created"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build images
    docker-compose build
    
    # Start core services
    docker-compose up -d postgres redis
    
    # Wait for database
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Start application services
    docker-compose up -d laravel-app agent-service nginx
    
    print_success "Services started successfully"
}

# Display service information
show_services() {
    print_success "PRIMA AI is now running!"
    echo ""
    echo "Service URLs:"
    echo "  🌐 Nginx Proxy:        http://localhost"
    echo "  🤖 Agent Service:      http://localhost/api/agent/"
    echo "  🐘 Laravel API:        http://localhost/api/"
    echo "  🎨 Web Widget:         http://localhost/widget/"
    echo "  🗄️  pgAdmin:            http://localhost:5050"
    echo ""
    echo "Development Services (use --profile development):"
    echo "  📊 Grafana:           http://localhost:3000"
    echo "  📈 Prometheus:        http://localhost:9090"
    echo ""
    echo "Useful commands:"
    echo "  View logs:           docker-compose logs -f"
    echo "  Stop services:       docker-compose down"
    echo "  Restart services:    docker-compose restart"
    echo "  View status:         docker-compose ps"
}

# Main setup process
main() {
    check_docker
    setup_environment
    create_directories
    generate_laravel_key
    setup_nginx
    start_services
    show_services
}

# Run main function
main "$@"
