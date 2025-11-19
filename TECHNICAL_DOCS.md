# Technical Documentation: Food Share Application

This document provides a detailed technical overview of the Food Share application, covering its architecture, key components, data flow, and design principles.

---

## 1. Project Overview

The Food Share application is a full-stack web platform designed to connect individuals with surplus food (donors) to those who can utilize it (claimers). It emphasizes real-time interaction, location-based discovery, and a community-driven reputation system to minimize food waste.

---

## 2. Technology Stack

*   **Frontend:**
    *   **React:** A JavaScript library for building user interfaces.
    *   **Vite:** A fast build tool that provides a lightning-fast development experience.
    *   **React Bootstrap:** A UI kit for building responsive and modern interfaces.
    *   **React Leaflet:** A library for integrating interactive maps (powered by Leaflet.js).
    *   **Axios:** A promise-based HTTP client for making API requests.
    *   **Socket.IO Client:** For real-time, bidirectional communication.
    *   **React Toastify:** For displaying notifications.
*   **Backend:**
    *   **Node.js:** A JavaScript runtime for server-side development.
    *   **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
    *   **MongoDB:** A NoSQL document database for storing application data.
    *   **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
    *   **JSON Web Tokens (JWT):** For secure user authentication.
    *   **Bcryptjs:** For hashing passwords.
    *   **Node-cron:** For scheduling background tasks (e.g., expiring posts).
    *   **Socket.IO:** For real-time, event-based communication between client and server.

---

## 3. Folder Structure

The project is organized into two main directories: `client` (for the React frontend) and `server` (for the Node.js/Express backend).

```
food-supply/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx             # Main application component, defines routing
│   │   ├── main.jsx            # Entry point for React app
│   │   ├── index.css           # Global CSS styles and variables
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── ChatModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── RateDonorForm.jsx
│   │   │   └── admin/          # Admin-specific components
│   │   │       ├── DashboardHome.jsx
│   │   │       ├── PostManagement.jsx
│   │   │       └── UserManagement.jsx
│   │   ├── context/            # React Context for global state management
│   │   │   └── AuthContext.jsx # Manages user authentication state
│   │   ├── hooks/              # Custom React Hooks
│   │   │   └── useSocket.js    # Manages Socket.IO connection
│   │   ├── pages/              # Top-level page components
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── ChatsPage.jsx
│   │   │   ├── CreatePostPage.jsx
│   │   │   ├── EditPostPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── MyPostsPage.jsx
│   │   │   ├── PostDetailsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── RegisterPage.jsx
│   │   └── services/           # API service functions
│   │       └── authService.js  # Handles authentication API calls
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Vite configuration (e.g., API proxy)
└── server/
    ├── .env                    # Environment variables (local only)
    ├── index.js                # Main server entry point, Express setup, DB connection, Socket.IO
    ├── package.json
    ├── config/
    │   └── db.js               # MongoDB connection setup
    ├── cron/
    │   └── expiryTracker.js    # Scheduled job for expiring posts
    ├── middleware/
    │   └── authMiddleware.js   # JWT authentication and authorization middleware
    ├── models/                 # Mongoose schemas and models
    │   ├── Conversation.js
    │   ├── FoodItem.js         # (Deprecated, replaced by FoodPost)
    │   ├── FoodPost.js         # Main model for food items
    │   ├── Message.js
    │   ├── Rating.js
    │   └── User.js
    └── routes/                 # Express API routes
        ├── admin.js
        ├── auth.js
        ├── chat.js
        ├── posts.js            # Main routes for food posts
        └── ratings.js
```

---

## 4. Backend Architecture (`server/`)

The backend is built with Node.js and Express.js, following a modular structure.

### `index.js`
This is the server's entry point. It sets up:
*   **Express App:** Initializes the Express application.
*   **Middleware:** Configures essential middleware (CORS, JSON body parser).
*   **Database Connection:** Calls `connectDB()` from `config/db.js`.
*   **API Routes:** Mounts all API routes (e.g., `/api/auth`, `/api/posts`).
*   **Socket.IO Server:** Integrates Socket.IO with the Express HTTP server, handling real-time connections and events.
*   **Cron Job:** Starts the `expiryTracker` cron job.

### `config/db.js`
Contains the `connectDB` function responsible for establishing a connection to MongoDB using Mongoose.

### `middleware/authMiddleware.js`
*   **`protect`:** Middleware to verify JWTs from incoming requests. If a valid token is found, it decodes the user information and attaches it to `req.user`.
*   **`authorize(roles)`:** Middleware to restrict access to routes based on user roles (e.g., `admin`).

### `models/`
Defines Mongoose schemas for the application's data entities:
*   **`User.js`:** Stores user details, including name, email, password, role (`user`/`admin`), `postsCompleted` count, and aggregate `rating`.
*   **`FoodPost.js`:** Represents a food item available for sharing. Includes `title`, `description`, `quantity`, `category`, `address`, `expiresAt`, `status` (`available`, `claimed`, `expired`, `completed`), `owner` (donor), `claimedBy` (claimer), and a `location` field (GeoJSON Point for geospatial queries with a `2dsphere` index).
*   **`Conversation.js`:** Stores metadata for chat conversations, linking two users and a `FoodPost`.
*   **`Message.js`:** Stores individual chat messages, linking to a `Conversation` and `sender`.
*   **`Rating.js`:** Stores user ratings for completed transactions, linking `rater`, `ratee`, and `post`.

### `routes/`
Each file defines a set of API endpoints related to a specific resource:
*   **`auth.js`:** User registration and login.
*   **`posts.js`:** CRUD operations for `FoodPost`s, including geospatial search, claiming, completing, and rating. Emits Socket.IO events for real-time updates.
*   **`chat.js`:** Handles fetching chat conversations and messages.
*   **`admin.js`:** Admin-specific routes for managing users and posts, often requiring the `authorize('admin')` middleware.
*   **`ratings.js`:** Provides an endpoint to check if a user has already rated a specific post.

### `cron/expiryTracker.js`
Contains a `node-cron` job that runs periodically (e.g., every 10 minutes) to check for expired `FoodPost`s and update their status to 'expired'.

---

## 5. Frontend Architecture (`client/`)

The frontend is a React application built with Vite, focusing on a component-based structure and state management.

### `main.jsx`
The entry point for the React application. It renders the `App` component, wrapped in `BrowserRouter` for routing and `AuthContext.Provider` for global authentication state.

### `App.jsx`
The main application component. It defines the overall layout (header, main content, footer) and sets up all client-side routes using `react-router-dom`. Routes are protected using `PrivateRoute` (for logged-in users) and `AdminRoute` (for admin users).

### `context/AuthContext.jsx`
Manages the global authentication state of the user. It provides:
*   `user`: The currently logged-in user object.
*   `login(email, password)`: Function to handle user login.
*   `register(name, email, password)`: Function to handle user registration.
*   `logout()`: Function to log out the user.
*   It stores the JWT in `localStorage` and attaches it to `axios` requests.

### `hooks/useSocket.js`
A custom React hook that manages a single, authenticated Socket.IO client connection. It ensures the socket is connected only when a user is logged in and handles reconnection logic. It provides the `socket` instance and its connection status.

### `services/authService.js`
Contains utility functions for interacting with the backend authentication API, including setting up `axios` interceptors to automatically attach the JWT to outgoing requests.

### `components/`
Contains reusable UI components:
*   **`Header.jsx`:** The navigation bar, displaying user status and navigation links.
*   **`PrivateRoute.jsx` / `AdminRoute.jsx`:** Components that wrap routes, redirecting unauthenticated or unauthorized users.
*   **`MapView.jsx`:** Integrates Leaflet.js to display food posts on an interactive map.
*   **`ChatModal.jsx`:** A modal component for real-time chat between users.
*   **`RateDonorForm.jsx`:** A form for submitting star ratings and comments after a transaction is completed.
*   **`admin/`:** Components specific to the admin dashboard, such as `UserManagement` and `PostManagement` tables.

### `pages/`
Contains the top-level components for each view/page of the application:
*   **`HomePage.jsx`:** Displays a list of nearby available food posts, with real-time updates.
*   **`LoginPage.jsx` / `RegisterPage.jsx`:** User authentication forms.
*   **`CreatePostPage.jsx` / `EditPostPage.jsx`:** Forms for creating and updating food posts, utilizing browser geolocation.
*   **`PostDetailsPage.jsx`:** Displays detailed information about a single food post, including actions like claiming, completing, chatting, and rating.
*   **`MyPostsPage.jsx`:** Lists posts created by the logged-in user.
*   **`ChatsPage.jsx`:** Displays a list of active chat conversations.
*   **`ProfilePage.jsx`:** Shows the logged-in user's profile information and reputation.
*   **`AdminDashboardPage.jsx`:** The main entry point for the admin interface, using tabs to switch between user and post management.

---

## 6. Core Workflows & Data Flow

### User Authentication
1.  **Frontend:** `LoginPage` or `RegisterPage` collects credentials.
2.  **`authService.js`:** Sends credentials to `POST /api/auth/register` or `POST /api/auth/login`.
3.  **Backend (`auth.js`):** Validates credentials, creates/finds user, generates JWT.
4.  **Backend:** Sends JWT back to frontend.
5.  **`authService.js`:** Stores JWT in `localStorage`, sets `axios` default header.
6.  **`AuthContext.jsx`:** Updates global `user` state.

### Food Post Lifecycle (Create, Discover, Claim, Complete, Rate)
1.  **Create Post (`CreatePostPage.jsx`):**
    *   Gets user's current geolocation via `navigator.geolocation`.
    *   Submits form data (including GeoJSON `location`) to `POST /api/posts`.
    *   **Backend (`posts.js`):** Creates `FoodPost` document, populates `owner`.
    *   **Backend:** Emits `new_post` Socket.IO event to all connected clients.
    *   **Frontend (`HomePage.jsx`):** Listens for `new_post` and adds it to its state, updating the UI in real-time.
2.  **Discover Posts (`HomePage.jsx`, `MapPage.jsx`):**
    *   Gets user's current geolocation.
    *   Sends `GET /api/posts?lat=<lat>&lng=<lng>&radiusKm=<radius>` request.
    *   **Backend (`posts.js`):** Performs a MongoDB `$near` geospatial query on the `FoodPost` collection (which has a `2dsphere` index on `location`). Filters by `status: 'available'` and `expiresAt`.
    *   **Backend:** Returns nearby posts.
    *   **Frontend:** Displays posts on list or map.
3.  **Claim Post (`PostDetailsPage.jsx`):**
    *   User clicks "Claim Item" button.
    *   Sends `POST /api/posts/:id/claim` request.
    *   **Backend (`posts.js`):** Updates `FoodPost` status to 'claimed', sets `claimedBy` field.
    *   **Backend:** Emits `post_update` Socket.IO event with the updated post.
    *   **Frontend (`HomePage.jsx`, `PostDetailsPage.jsx`):** Listens for `post_update` and updates the post's status in their respective states.
    *   **Backend (`chat.js`):** A new chat conversation is implicitly created when a post is claimed (or when the first message is sent).
4.  **Chat (`ChatModal.jsx`):**
    *   User sends message via `ChatModal`.
    *   **Frontend:** Emits `sendMessage` Socket.IO event to the backend, including `conversationId`, `senderId`, `messageText`.
    *   **Backend (`index.js` Socket.IO handler):** Saves message to `Message` collection, then emits `newMessage` to the specific chat room (`chat:<conversationId>`).
    *   **Frontend (`ChatModal.jsx`):** Listens for `newMessage` and displays it in the chat window.
5.  **Complete Post (`PostDetailsPage.jsx`):**
    *   Claimer clicks "Mark as Received" button.
    *   Sends `POST /api/posts/:id/complete` request.
    *   **Backend (`posts.js`):** Updates `FoodPost` status to 'completed', increments `postsCompleted` count for the donor's `User` profile.
    *   **Backend:** Emits `post_update` Socket.IO event.
    *   **Frontend:** Updates post status.
6.  **Rate Donor (`RateDonorForm.jsx`):**
    *   Claimer submits rating form.
    *   Sends `POST /api/posts/:id/rate` request.
    *   **Backend (`posts.js`):** Creates `Rating` document, updates the donor's aggregate `rating` and `ratingCount` in their `User` profile.
    *   **Backend:** Emits `rating_updated` Socket.IO event (to the donor's specific user room).
    *   **Frontend:** Updates donor's rating display.

---

## 7. Database Schema Overview

*   **`users` collection:**
    *   `name: String`
    *   `email: String (unique)`
    *   `password: String (hashed)`
    *   `role: String ('user', 'admin')`
    *   `postsCompleted: Number (count of completed transactions as a donor)`
    *   `rating: Number (average rating)`
    *   `ratingCount: Number (total number of ratings received)`
*   **`foodposts` collection:**
    *   `title: String`
    *   `description: String`
    *   `quantity: String`
    *   `category: String`
    *   `address: String`
    *   `location: { type: 'Point', coordinates: [Number, Number] }` (with `2dsphere` index)
    *   `expiresAt: Date`
    *   `status: String ('available', 'claimed', 'expired', 'completed')`
    *   `owner: ObjectId (ref: 'User')`
    *   `claimedBy: ObjectId (ref: 'User')`
*   **`conversations` collection:**
    *   `participants: [ObjectId (ref: 'User')]`
    *   `relatedPostId: ObjectId (ref: 'FoodPost')`
*   **`messages` collection:**
    *   `conversation: ObjectId (ref: 'Conversation')`
    *   `sender: ObjectId (ref: 'User')`
    *   `content: String`
*   **`ratings` collection:**
    *   `post: ObjectId (ref: 'FoodPost')`
    *   `rater: ObjectId (ref: 'User')`
    *   `ratee: ObjectId (ref: 'User')`
    *   `stars: Number (1-5)`
    *   `comment: String`

---

## 8. Real-time Communication (Socket.IO)

Socket.IO is integrated for instant updates:
*   **`new_post`:** Emitted when a new post is created, updates `HomePage` lists.
*   **`post_update`:** Emitted when a post's status changes (claimed, completed, edited), updates `HomePage` and `PostDetailsPage`.
*   **`post_delete`:** Emitted when a post is deleted, removes it from `HomePage` and redirects `PostDetailsPage`.
*   **`newMessage`:** Emitted when a message is sent, updates `ChatModal` for participants.
*   **`rating_updated`:** Emitted when a user's rating changes, updates relevant UI elements (e.g., profile page).

---

This documentation provides a comprehensive understanding of the Food Share application's technical aspects, enabling developers to effectively maintain and extend the project.