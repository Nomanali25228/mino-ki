# Shopping Hub Backend API

A Node.js Express API for the Shopping Hub application with real-time chat functionality, user management, product management, and more.

## 🚀 Vercel Deployment

This project is configured for easy deployment on Vercel. Follow these steps to deploy:

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Account**: Your code should be in a Git repository
3. **MongoDB Atlas**: Set up a MongoDB database (free tier available)

### Environment Variables

Before deploying, you need to set up these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=your_frontend_url (optional)
```

### Deployment Steps

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - Framework Preset: `Node.js`
   - Root Directory: `./` (or leave empty)
   - Build Command: Leave empty (not needed for this setup)
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically detect the configuration from `vercel.json`

### API Endpoints

Once deployed, your API will be available at:
- Production: `https://your-project-name.vercel.app`
- Preview: `https://your-project-name-git-branch.vercel.app`

### API Routes

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/chat` - Chat functionality
- `/api/faqs` - FAQ management
- `/api/deposits` - Deposit management

## 🛠️ Local Development

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Database Seeding

```bash
npm run seed:faqs
```

## 📁 Project Structure

```
src/
├── controllers/     # Route controllers
├── data/           # Sample data
├── lib/            # Utility libraries
├── middleware/     # Express middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── seeders/        # Database seeders
├── tests/          # Test files
└── index.js        # Main server file
```

## 🔧 Configuration

The project uses:
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Cloudinary** - Image upload
- **CORS** - Cross-origin resource sharing

## 📝 Notes

- The server runs on port 5001 by default locally
- Vercel automatically assigns a port in production
- Socket.io is configured for real-time chat functionality
- All routes are prefixed with `/api` in production

## 🚨 Important

- Never commit your `.env` file to version control
- Ensure all environment variables are set in Vercel dashboard
- MongoDB Atlas connection string should include username, password, and database name
- JWT_SECRET should be a strong, random string

## 📞 Support

If you encounter any issues during deployment, check:
1. Environment variables are correctly set
2. MongoDB Atlas connection is working
3. All dependencies are properly installed
4. Vercel build logs for any errors
