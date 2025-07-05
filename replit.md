# WorkMoments - Employee Recognition Platform

## Overview

WorkMoments is a comprehensive employee recognition platform that combines NFC technology, media management, social features, and a referral system to create meaningful workplace experiences. The application enables employees to access personal timelines through NFC tags while providing HR teams with powerful tools for content management, employee engagement, analytics, and recruitment through employee referrals.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Session-based authentication with bcrypt password hashing
- **File Storage**: Local filesystem with multer for file uploads
- **API Design**: RESTful API with structured error handling

### Development Setup
- **Monorepo Structure**: Shared types and schemas between client and server
- **TypeScript**: Full type safety across the entire application
- **ESM**: Modern ES modules throughout the codebase
- **Hot Reload**: Vite dev server with HMR for rapid development

## Key Components

### Database Schema
The application uses a relational database with the following core entities:
- **Companies**: Multi-tenant structure with plan-based access
- **Users**: HR/Admin users with role-based permissions
- **Employees**: Staff members with NFC token access
- **Media Items**: Photos, videos, and documents with metadata
- **Timeline Items**: Personalized content entries for employees
- **Compliments**: Peer-to-peer recognition system
- **Templates**: Reusable content patterns
- **Triggers**: Event-based content automation
- **Analytics**: Usage tracking and engagement metrics
- **Job Openings**: Available positions for referral system
- **Referrals**: Employee referral tracking and bonus management
- **Referral Settings**: Configurable bonus amounts and terms

### Authentication System
- **Multi-level Access**: Company admins, HR users, and employee access
- **NFC Integration**: Unique tokens for password-free employee access
- **Session Management**: Server-side session storage with PostgreSQL
- **Security**: Bcrypt password hashing and secure session handling

### Media Management
- **File Upload**: Multer-based file handling with type validation
- **Media Library**: Centralized content repository with tagging
- **Content Organization**: Department and employee-specific content
- **File Types**: Support for images, videos, and documents

### Employee Experience
- **NFC Access**: Tap-to-access personal timelines
- **Timeline View**: Chronological display of personal moments
- **Compliment System**: Send and receive peer recognition
- **Content Interaction**: Like, share, and download capabilities

### HR Dashboard
- **Employee Management**: CRUD operations for staff records
- **Content Management**: Upload and organize media assets
- **Analytics**: Engagement metrics and usage statistics
- **Automation**: Template-based content delivery

## Data Flow

### Employee Timeline Access
1. Employee taps NFC tag containing unique token
2. System validates token and retrieves employee record
3. Timeline items are fetched and displayed chronologically
4. Employee can interact with content and send compliments

### Content Management Flow
1. HR uploads media through dashboard interface
2. Files are stored locally with metadata in database
3. Content can be assigned to specific employees or departments
4. Timeline items are created linking content to employees

### Recognition System
1. Users can send compliments to colleagues
2. Compliments are stored with optional anonymity
3. Recipients receive notifications (planned feature)
4. Engagement metrics are tracked for analytics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **react-hook-form**: Form validation and handling
- **bcrypt**: Password hashing
- **multer**: File upload handling

### Development Dependencies
- **drizzle-kit**: Database schema management
- **tsx**: TypeScript execution
- **vite**: Build tool and dev server
- **tailwindcss**: CSS framework

## Deployment Strategy

### Build Process
- **Client Build**: Vite bundles React application to `dist/public`
- **Server Build**: ESBuild compiles Node.js server to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes
- **Static Assets**: File uploads stored in local `uploads` directory

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment flag for development/production
- **Session Management**: In-memory sessions for development

### Production Considerations
- File storage should be migrated to cloud storage (S3, CloudFlare R2)
- Session storage should use Redis or database-backed sessions
- Media CDN integration for optimal performance
- Environment-specific configuration management

## Changelog

Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Referral system integration completed
- July 03, 2025. Fixed LanguageProvider conflicts and routing issues
- July 03, 2025. All core APIs tested and working (registration, login, employees, media, NFC, compliments, templates)
- July 03, 2025. Database fully operational with 6 companies, 6 users, 5 employees, 1 media item, 1 compliment, 1 template
- July 03, 2025. Implemented comprehensive authentication system with AuthProvider, protected routes, and logout functionality
- July 03, 2025. Fixed "Add Employee" button in employee management - now properly opens employee import modal
- July 03, 2025. Enhanced employee data model with comprehensive fields (phone, position, manager, employee number, address, emergency contact, salary, notes)
- July 03, 2025. Created employee profile page (/profile/:nfcToken) where employees can view and edit their personal information
- July 03, 2025. Added profile links to HR dashboard employee table for easy access to employee profile management
- July 03, 2025. Implemented template upload functionality - HR administrators can now upload templates from external sources like Canva (PNG, JPG, PDF)
- July 03, 2025. Compliment system updated: removed anonymous option, made colleague selection mandatory, Dutch interface implemented
- July 03, 2025. Fixed template builder API errors and database schema issues
- July 03, 2025. Connected compliment dropdown to employees database for proper colleague selection
- July 03, 2025. Template creation feature temporarily disabled - showing "Coming Soon" message until advanced template system is ready
- July 05, 2025. Implemented media send functionality - users can now click on media items to open a modal and send them to selected employees via checkbox selection
- July 05, 2025. Added media send modal with employee selection, optional message, and bulk timeline item creation
- July 05, 2025. Created new API endpoint /api/timeline-items for sending media to multiple employees simultaneously
- July 05, 2025. Added media delete functionality - users can now remove media items from the library with confirmation dialog
- July 05, 2025. Implemented DELETE /api/media/:id endpoint with company-based permission checks
- July 05, 2025. Added QR code functionality for employees - each employee now has both NFC token and QR code access
- July 05, 2025. Created QR code generator component and modal with download, copy URL, and profile testing features
- July 05, 2025. Integrated QR code buttons in employee table - users can generate QR codes that link to employee profiles
- July 05, 2025. Implemented comprehensive referral program in HR dashboard with job management and referral tracking
- July 05, 2025. Added PDF upload functionality for job postings with file storage integration
- July 05, 2025. Created referral management interface with job creation, editing, deletion and referral approval workflows
- July 05, 2025. Added analytics tracking for referral submissions and media views
- July 05, 2025. Created POST /api/analytics/media-view endpoint for tracking when employees view media content
- July 05, 2025. Enhanced analytics dashboard with referral and media view statistics cards in Dutch interface
- July 05, 2025. Implemented automatic media view tracking in timeline items when images load successfully
- July 05, 2025. Fixed media deletion cascade issue - now properly removes related timeline items before deleting media
- July 05, 2025. Enhanced video preview functionality with improved thumbnail display and modal viewing for all media types
- July 05, 2025. Improved MediaPreviewModal with support for photos, videos, and PDFs including download and full-screen viewing
- July 05, 2025. Extended video file upload support for .mov files and additional video formats with fallback extension checking
- July 05, 2025. Enhanced PDF preview functionality with improved MediaPreviewModal iframe display and better PDF thumbnail styling in media library
- July 05, 2025. Completely rebuilt MediaPreviewModal with robust error handling and fallback options for all media types (photos, videos, PDFs)
- July 05, 2025. Improved timeline media preview with better error handling and fallback displays for broken media files
- July 05, 2025. Fixed download button logic in timeline items - compliments now show no download button, only media items from bibliotheek have download functionality
- July 05, 2025. Resolved eye button functionality in HR media library - now correctly opens preview modal instead of send modal
- July 05, 2025. Fixed media library data loading by adding proper queryFn functions and eliminated page reload dependency for uploads
- July 05, 2025. Enhanced analytics dashboard with comprehensive media views and referral tracking
- July 05, 2025. Added bonus payment tracking and engagement percentage calculations
- July 05, 2025. Implemented platform engagement summary with media engagement rate and referral participation metrics
- July 05, 2025. Created comprehensive analytics overview showing media views (2), referrals (1), and bonus payments in Dutch interface

## User Preferences

Preferred communication style: Simple, everyday language.