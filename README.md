# Fleetify Frontend

jQuery-based frontend application for Fleetify Procurement System.

## Setup

1. Update the API base URL in `js/config.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-backend-url.com/api/v1',
    // ...
};
```

2. Open `index.html` in a web browser or serve via a local server.

## GitHub Pages Deployment

### Prerequisites
- GitHub account
- Repository with this frontend code

### Deployment Steps

1. **Update API Configuration**
   - Edit `js/config.js` and set `API_BASE_URL` to your production backend URL
   - Example: `API_BASE_URL: 'https://your-backend.herokuapp.com/api/v1'`

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fleetify Frontend"
   git branch -M main
   git remote add origin https://github.com/yourusername/fleetify-fe.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

4. **Access Your Site**
   - Your site will be available at: `https://yourusername.github.io/fleetify-fe/`
   - GitHub Pages may take a few minutes to deploy

### Important Notes for GitHub Pages

- **CORS Configuration**: Ensure your backend API allows requests from your GitHub Pages domain
- **HTTPS**: GitHub Pages uses HTTPS, so your backend API must also support HTTPS or configure CORS properly
- **API URL**: Update `js/config.js` with your production backend URL before deploying
- **No Server-Side Code**: GitHub Pages only serves static files (HTML, CSS, JS)

### Local Development vs Production

**Local Development:**
```javascript
API_BASE_URL: 'http://127.0.0.1:3000/api/v1'
```

**Production (GitHub Pages):**
```javascript
API_BASE_URL: 'https://your-backend-api.com/api/v1'
```

## Features

### Pages
- **Landing Page** (`index.html`) - Welcome page with navigation to login
- **Login/Register** (`login.html`) - Authentication page
- **Dashboard** (`dashboard.html`) - Main application with all functionality

### Core Functionality
- Login/Register with JWT token storage
- Inventory display with stock information
- Create Purchase with cart functionality
- Purchase history with detail view

### UI Components
- Button (Primary, Secondary, Tertiary)
- Chip (for status badges)
- Fillbox (input fields)
- Toast notifications (Error, Success, Info)
- Loading indicators (Page Loading, Div Loading)

### Best Practices Implemented
- Event Delegation for dynamically created elements
- Reusable AJAX wrapper function
- Robust error handling with Toast notifications
- JWT token management

## File Structure

```
FleetifyFE/
├── index.html          # Landing page
├── login.html          # Login/Register page
├── dashboard.html      # Main dashboard
├── css/
│   └── style.css      # Custom styles and Tailwind utilities
├── js/
│   ├── config.js      # Configuration (API URL, etc.)
│   ├── app.js         # Core application utilities
│   ├── auth.js        # Authentication logic
│   └── dashboard.js   # Dashboard functionality
└── README.md          # This file
```

## Usage

1. Start by opening `index.html` or `login.html`
2. Register a new account or login
3. Access the dashboard to:
   - View inventory
   - Create purchase orders
   - View purchase history

## Dependencies

- jQuery 3.7.1 (via CDN)
- Tailwind CSS (via CDN)

## Notes

- All API requests require JWT token (automatically handled)
- Token is stored in localStorage
- Session expires after 24 hours (as per backend)
- Error handling includes automatic redirect to login on 401 errors

