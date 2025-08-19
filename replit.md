# Roblox Telegram Bot

## Overview

This is a comprehensive Roblox Telegram Bot system that allows game developers to send messages to their Roblox game chat via Telegram commands. The system consists of a React-based web dashboard for monitoring and configuration, and a Node.js backend that handles Telegram bot integration, message routing, and database operations. The application enables remote communication with Roblox games through both MessagingService and HTTP polling methods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React and TypeScript, utilizing modern UI patterns:
- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with a dark theme design system
- **Component Library**: Radix UI components with shadcn/ui for consistent, accessible interfaces
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite for fast development and optimized production builds

The frontend provides three main views: Dashboard (overview and quick actions), Settings (configuration management), and Logs (message history and monitoring).

### Backend Architecture
The server-side application follows an Express.js REST API pattern:
- **Runtime**: Node.js with TypeScript and ES modules
- **Web Framework**: Express.js for HTTP server and API endpoints
- **API Structure**: RESTful endpoints for system status, configuration management, and message logging
- **Development**: Hot reloading with Vite middleware integration
- **Error Handling**: Centralized error handling with structured JSON responses

### Data Storage Solutions
The application uses a flexible storage abstraction pattern:
- **ORM**: Drizzle ORM with Zod schema validation for type-safe database operations
- **Database**: PostgreSQL (via Neon serverless) for production data persistence
- **Development**: In-memory storage implementation for local development and testing
- **Schema**: Structured tables for users, telegram config, authorized users, roblox config, message logs, and system status

### Authentication and Authorization
The system implements a multi-layer authorization approach:
- **Telegram User Authorization**: Whitelist-based system storing authorized Telegram user IDs
- **Bot Token Management**: Secure storage and validation of Telegram bot tokens
- **API Key Management**: Support for Roblox API keys for enhanced integration capabilities
- **Session Management**: Basic session handling for web dashboard access

### External Service Integrations
The architecture supports multiple external service integrations:
- **Telegram Bot API**: Primary integration for receiving commands and sending responses
- **Roblox Integration**: Multiple connection methods including MessagingService and HTTP webhooks
- **Real-time Monitoring**: System status tracking for all connected services
- **Message Routing**: Intelligent message delivery system with retry logic and error handling

The system is designed to be resilient with proper error handling, logging, and status monitoring across all integration points. The modular architecture allows for easy extension of both Roblox integration methods and additional communication platforms.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL serverless database connectivity
- **node-telegram-bot-api**: Telegram Bot API integration for message handling
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL
- **@tanstack/react-query**: Server state management and caching for React frontend
- **@radix-ui/***: Accessible UI component primitives for consistent interface design
- **tailwindcss**: Utility-first CSS framework for responsive design system
- **express**: Web framework for REST API server implementation
- **zod**: Runtime type validation for API requests and database schemas
- **vite**: Build tool and development server with hot module replacement
- **typescript**: Static type checking for both frontend and backend code
- **wouter**: Lightweight client-side routing for single-page application navigation