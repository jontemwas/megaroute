# MikroTik Hotspot Management System

## Overview

This is a full-stack web application for managing MikroTik router hotspots with integrated M-Pesa payment processing. The system provides a captive portal for WiFi users to purchase internet access plans and an admin dashboard for managing subscriptions, routers, and payments. The application handles the complete flow from user authentication through MikroTik routers to payment processing via M-Pesa STK Push.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Routing**: Wouter for client-side routing with three main routes: captive portal (`/`), admin login (`/admin`), and admin dashboard (`/admin/dashboard`)
- **UI Components**: Radix UI primitives with shadcn/ui design system and Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with routes for authentication, payment processing, and CRUD operations
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication stored in sessionStorage (development setup)
- **Error Handling**: Centralized error handling middleware with structured error responses

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: 
  - `admins` - Admin user accounts
  - `subscription_plans` - Internet access plans with pricing and duration
  - `mikrotik_routers` - Router configuration and connection details
  - `hotspot_users` - WiFi users and their subscription status
  - `mpesa_transactions` - Payment transaction records
  - `user_sessions` - Active user session tracking

### Integration Services

#### MikroTik Router Integration
- **Protocol**: RouterOS API for remote router management
- **Functionality**: User creation, session management, and bandwidth control
- **Connection**: Direct API calls to configured MikroTik routers with credential management
- **User Management**: Automatic hotspot user provisioning based on subscription plans

#### M-Pesa Payment Integration
- **API**: Safaricom M-Pesa STK Push for mobile money payments
- **Flow**: Payment initiation → STK Push → callback processing → user activation
- **Security**: OAuth token management and callback URL verification
- **Transaction Tracking**: Complete audit trail of payment attempts and completions

### Security Considerations
- **Password Hashing**: bcryptjs for admin password security
- **Input Validation**: Zod schemas for runtime type checking and validation
- **Database Security**: Parameterized queries through Drizzle ORM
- **Environment Variables**: Sensitive configuration stored in environment variables

### Development Tools
- **Build System**: Vite with hot module replacement for fast development
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Database Tools**: Drizzle Studio for database management and debugging

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Payment Gateway**: Safaricom M-Pesa Daraja API for mobile payments
- **Network Equipment**: MikroTik RouterOS devices for WiFi hotspot management

### Third-Party Services
- **Authentication**: Custom session-based authentication (can be upgraded to OAuth providers)
- **UI Components**: Radix UI for accessible component primitives
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration for typography

### Development Dependencies
- **Runtime**: Node.js with ES modules
- **Package Manager**: npm for dependency management
- **Development Server**: Vite dev server with proxy configuration for API calls
- **Database Migration**: Drizzle Kit for schema versioning and deployment

## Deployment

### VPS Deployment
The system includes comprehensive deployment scripts and configuration for production VPS deployment:

- **Automated Deployment**: `deploy.sh` script handles complete server setup
- **Process Management**: PM2 ecosystem configuration for production scaling
- **Web Server**: Nginx configuration with SSL, security headers, and rate limiting
- **Database**: PostgreSQL with automated backup scripts
- **Environment**: Production environment configuration template
- **Security**: Firewall configuration, SSL certificates, and secure headers

### Deployment Files
- `DEPLOYMENT.md` - Complete step-by-step deployment guide
- `deploy.sh` - Automated deployment script for Ubuntu/Debian VPS
- `ecosystem.config.js` - PM2 process management configuration
- `nginx.conf` - Production-ready Nginx configuration
- `.env.example` - Environment variables template
- `package-scripts/production-setup.js` - Database and admin user setup script

### Production Requirements
- Ubuntu 20.04+ VPS server
- Domain name with DNS configuration
- PostgreSQL database (local or cloud)
- SSL certificate (Let's Encrypt recommended)
- M-Pesa production API credentials