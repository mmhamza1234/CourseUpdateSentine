# replit.md

## Overview

Course Update Sentinel is a comprehensive monitoring and content management system designed to track AI tool changes that impact educational course materials. The application automatically monitors various AI vendors (like OpenAI, n8n, Canva) through RSS feeds, HTML scraping, and API endpoints, then uses AI-powered analysis to determine how changes affect course assets and generates actionable tasks for content creators.

The system manages a 9-module AI course (M1-M9) covering topics from basic AI concepts to advanced automation, with each module containing various assets like slides, tool demonstrations, and screen recordings. When changes are detected in monitored tools, the system classifies their impact severity and automatically creates tasks for course maintainers to update affected materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript, utilizing Vite as the build tool and development server. The UI follows a modern design system using:
- **Shadcn/ui components** for consistent, accessible UI elements
- **Tailwind CSS** for styling with CSS variables for theming
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form with Zod** for form validation and type safety

The frontend supports RTL (Right-to-Left) layout switching for Arabic content, implemented through a context provider that dynamically adjusts font families and text direction.

### Backend Architecture
The server follows a REST API architecture built with Express.js and TypeScript:
- **Express.js** handles HTTP routing and middleware
- **Custom route registration** system for modular API endpoints
- **Authentication middleware** using JWT tokens and magic link authentication
- **Error handling middleware** for consistent API responses
- **Development/production environment** separation with Vite integration

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:
- **Drizzle ORM** provides schema definition and query building
- **Neon Database** as the PostgreSQL provider (serverless)
- **Connection pooling** through Neon's serverless driver
- **Schema migrations** managed through Drizzle Kit

The database schema includes entities for vendors, sources, modules, assets, change events, impacts, tasks, decision rules, and audit logs, forming a comprehensive content management and monitoring system.

### Authentication and Authorization
Magic link authentication system providing passwordless login:
- **Magic link generation** and email delivery via SMTP
- **JWT token** management for session persistence
- **User roles** and permissions (USER/ADMIN)
- **Email-based** user identification and account creation

The system automatically creates user accounts on first login and supports role-based access control.

### Background Processing and Monitoring
Automated monitoring and task generation using Bull queues and cron jobs:
- **Redis-backed job queues** for processing change events
- **Cron scheduling** for daily monitoring (09:30 Africa/Cairo) and weekly digests
- **Multi-step processing pipeline**: fetch changes → summarize → classify impacts → generate tasks
- **Circuit breaker patterns** for source reliability
- **Exponential backoff** retry mechanisms

The system processes three types of monitoring sources: RSS feeds, HTML scraping with CSS selectors, and API endpoints.

## External Dependencies

### Database and Storage
- **PostgreSQL** via Neon Database for primary data storage
- **Redis** for job queue management and caching
- **Drizzle ORM** for database schema and query management

### AI and Processing Services
- **OpenAI API** (GPT-5) for change summarization and impact classification
- **Multiple AI processing prompts**: change summary, impact classification, task generation, and patch script generation

### Email and Communication
- **SMTP service** for magic link delivery and notifications
- **Nodemailer** for email sending capabilities
- **Bull queues** for reliable background job processing

### Monitoring Sources
The system monitors various AI tool vendors including:
- **OpenAI ChatGPT** (release notes and platform changelog)
- **n8n** (GitHub changelog)
- **Notion, Canva, Gamma** (product updates)
- **CapCut, ElevenLabs** (feature and pricing changes)
- **Google Workspace** (policy and security updates)

### Development and Deployment
- **Vite** for frontend development and building
- **ESBuild** for server bundling
- **TypeScript** for type safety across the stack
- **Replit environment** with custom plugins for development

The application is designed to run in both development (with Vite HMR) and production environments, with automatic environment detection and appropriate middleware configuration.