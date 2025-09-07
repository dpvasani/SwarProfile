@@ .. @@
 ## Features
 
 - **Production-Grade Setup**: Configured for scalability, security, and performance.
 - **Express.js**: Minimalist web framework for routing and middleware.
 - **MongoDB**: Integrated with Mongoose ORM for schema management and database operations.
 - **User Model**: Pre-configured with basic fields like `name`, `email`, and `password`.
+- **Artist Profile System**: Automated document extraction and artist profile management.
+- **Document Processing**: OCR and text extraction from PDF, DOC, and image files.
+- **Role-Based Access Control**: Admin and User roles with different permissions.
 - **Prettier**: Code formatting with custom rules for maintaining code consistency.
 - **Environment Configuration**: `.env` file for secure storage of sensitive data (e.g., database credentials, API keys).
 - **Git Best Practices**: `.gitignore` for keeping sensitive files out of version control.
@@ .. @@
 ├── src/                       # Main application code
 │   ├── controllers/           # Route controllers (business logic)
+│   │   ├── user.controller.js # User authentication and management
+│   │   └── artist.controller.js # Artist profile and document processing
 │   ├── models/                # Mongoose models (database schema)
+│   │   ├── user.model.js      # User model with role-based access
+│   │   └── artist.model.js    # Artist profile model
 │   ├── routes/                # Route definitions (API endpoints)
+│   │   ├── user.routes.js     # User authentication routes
+│   │   └── artist.routes.js   # Artist management routes
 │   ├── middlewares/           # Custom middleware (e.g., authentication)
+│   │   ├── auth.middleware.js # JWT authentication
+│   │   ├── admin.middleware.js # Admin role verification
+│   │   ├── multer.middleware.js # File upload handling
+│   │   └── fileValidation.middleware.js # File validation
 │   ├── config/                # Configuration files (e.g., database setup)
 │   ├── services/              # Service logic (e.g., external API calls, utilities)
+│   ├── utils/                 # Utility functions
+│   │   ├── documentExtractor.js # Document processing and OCR
+│   │   ├── textCleaner.js     # Text cleaning and validation
+│   │   ├── validation.js      # Input validation helpers
+│   │   ├── cloudinary.js      # Cloud storage integration
+│   │   ├── ApiError.js        # Custom error handling
+│   │   ├── ApiResponse.js     # Standardized API responses
+│   │   └── asyncHandler.js    # Async error handling
 │   └── app.js                 # Main application file
@@ .. @@
 REFRESH_TOKEN_EXPIRY=10d
 CLOUDINARY_CLOUD_NAME=
 CLOUDINARY_API_KEY=
 CLOUDINARY_API_SECRET=
+
+# Admin Configuration (optional)
+ADMIN_EMAILS=admin@example.com,admin2@example.com
 ```
 
 ### Installation
@@ .. @@
 4. Start the server:
 
    ```bash
    npm run dev
    ```
+
+## API Endpoints
+
+### Authentication
+- `POST /api/v1/users/register` - Register new user
+- `POST /api/v1/users/login` - User login
+- `POST /api/v1/users/logout` - User logout (protected)
+- `POST /api/v1/users/refresh-token` - Refresh access token
+
+### Artist Management
+
+#### Public Routes (User Access)
+- `GET /api/v1/artists` - Get all verified artists (summary view)
+- `GET /api/v1/artists/:id` - Get single artist details
+
+#### Admin Routes (Admin Access Required)
+- `POST /api/v1/artists/admin/upload` - Upload and extract document
+- `GET /api/v1/artists/admin/all` - Get all artists (full details)
+- `GET /api/v1/artists/admin/stats` - Get extraction statistics
+- `PATCH /api/v1/artists/admin/:id` - Update artist information
+- `PATCH /api/v1/artists/admin/:id/photo` - Upload/update artist photo
+- `PATCH /api/v1/artists/admin/:id/verify` - Verify artist profile
+- `DELETE /api/v1/artists/admin/:id` - Delete artist
+
+## Document Processing Features
+
+### Supported File Types
+- **PDF**: Text extraction using pdf-parse
+- **DOC/DOCX**: Text extraction using mammoth
+- **JPEG/PNG**: OCR using Tesseract.js
+
+### Extracted Information
+- Artist Name
+- Guru Name
+- Gharana (Musical tradition)
+- Contact Details (Phone, Email, Address)
+- Biography/Description
+- Raw extracted text for admin review
+
+### Processing Workflow
+1. Admin uploads document
+2. System automatically extracts information
+3. Admin reviews and verifies extracted data
+4. System generates summary for public view
+5. Users can view artist summary and photo
+
+## Role-Based Access Control
+
+### Admin Role
+- Upload and process documents
+- View all extracted details
+- Edit and verify artist information
+- Manage artist photos
+- Access extraction statistics
+
+### User Role
+- View verified artist summaries
+- View artist photos
+- Search artists by name, guru, or gharana
+
+## Security Features
+
+- JWT-based authentication
+- Role-based access control
+- Input validation and sanitization
+- File type and size validation
+- Secure file upload to Cloudinary
+- Error handling without sensitive data exposure