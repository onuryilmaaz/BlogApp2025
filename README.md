# Blog Application - MERN Stack

A modern, full-stack blog application built with MongoDB, Express.js, React.js, and Node.js. Features AI-powered content generation, secure authentication, and a responsive design.

## 🚀 Features

### Core Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control (Admin/Member)
- **Blog Management**: Create, read, update, and delete blog posts with markdown support
- **Comment System**: Nested comments with real-time interactions
- **AI Integration**: AI-powered blog post generation, ideas, and comment replies using Google Gemini
- **Tag System**: Organize posts with tags and tag-based filtering
- **Search Functionality**: Full-text search across blog posts
- **Image Upload**: Optimized image handling with automatic resizing and compression

### Security Features

- **Rate Limiting**: Protection against brute-force attacks and spam
- **Input Validation**: Comprehensive server-side validation using express-validator
- **Security Headers**: Helmet.js for security headers
- **JWT Token Management**: Secure token handling with automatic expiration
- **Image Optimization**: Sharp-based image processing with size limits

### Performance Features

- **Database Indexing**: Optimized MongoDB queries with proper indexing
- **Lazy Loading**: Image lazy loading for better performance
- **Caching**: Frontend caching strategies with React Query
- **Error Handling**: Centralized error handling and logging with Winston
- **State Management**: Zustand for efficient client-side state management
- **Data Validation**: Zod for runtime type checking and validation
- **Code Splitting**: Lazy loading of components for reduced bundle size
- **Image Optimization**: OptimizedImage component with fallbacks and loading states
- **Memoization**: React.memo, useCallback, and useMemo for render optimization

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer & Sharp** - Image upload and processing
- **Winston** - Logging
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation

### Frontend

- **React.js** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **React Query (@tanstack/react-query)** - Data fetching and caching
- **Zustand** - State management
- **Zod** - Schema validation
- **React Markdown** - Markdown rendering
- **React Hot Toast** - Notifications

### AI Integration

- **Google Gemini AI** - Content generation and assistance

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key

### Backend Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd BlogApp/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp env.example .env
```

4. Configure environment variables in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/blogapp
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_ACCESS_TOKEN=your-admin-access-token
GEMINI_API_KEY=your-gemini-api-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

5. Start the backend server:

```bash
# Development
npm run dev

# Production
npm start
```

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `ADMIN_ACCESS_TOKEN`: Token for creating admin users
- `GEMINI_API_KEY`: Google Gemini AI API key
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS
- `LOG_LEVEL`: Logging level (info/debug/error)

### Database Indexes

The application automatically creates the following indexes for optimal performance:

- BlogPost: slug, tags, createdAt, views, likes, author
- Comment: post, author, parentComment
- User: email, role, createdAt

## 🔐 Security Features

### Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **Comment creation**: 10 requests per 5 minutes
- **AI endpoints**: 20 requests per hour
- **General endpoints**: 100 requests per 15 minutes

### Input Validation

- Email format validation
- Password strength requirements
- Content length limits
- File type and size restrictions
- MongoDB ObjectId validation

### Image Security

- File type restrictions (JPEG, PNG, WebP)
- Size limits (10MB max)
- Automatic optimization and resizing
- Secure file naming

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/upload-image` - Upload profile image

### Blog Post Endpoints

- `GET /api/posts` - Get all posts
- `GET /api/posts/:slug` - Get post by slug
- `POST /api/posts` - Create new post (Admin only)
- `PUT /api/posts/:id` - Update post (Admin only)
- `DELETE /api/posts/:id` - Delete post (Admin only)
- `GET /api/posts/tag/:tag` - Get posts by tag

### Comment Endpoints

- `GET /api/comments/:postId` - Get comments for a post
- `POST /api/comments/:postId` - Add comment (Auth required)
- `DELETE /api/comments/:commentId` - Delete comment (Author/Admin only)

### AI Endpoints

- `POST /api/ai/generate` - Generate blog post content
- `POST /api/ai/generate-ideas` - Generate blog post ideas
- `POST /api/ai/generate-reply` - Generate comment reply
- `POST /api/ai/generate-summary` - Generate post summary

## 🎨 UI/UX Features

### Responsive Design

- Mobile-first approach
- Responsive navigation
- Optimized for all screen sizes

### User Experience

- Lazy loading images
- Loading states and error handling
- Toast notifications
- Empty state components
- Dynamic navigation active states

### Accessibility

- Semantic HTML
- Keyboard navigation
- Screen reader support
- High contrast ratios

## 🚀 Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for production frontend URL
5. Set up process manager (PM2 recommended)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables for production API URL

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 📊 Monitoring and Logging

### Logging

- Winston logger with file rotation
- Different log levels (error, info, debug)
- Request logging with Morgan
- Error tracking and monitoring

### Performance Monitoring

- Database query optimization
- Response time monitoring
- Memory usage tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🔄 Version History

### v1.0.0

- Initial release with core features
- User authentication and authorization
- Blog post management
- Comment system
- AI integration
- Security enhancements
- Performance optimizations

---

**Built with ❤️ using the MERN stack**
