# Food Share - A Full-Stack Food Sharing Platform

Food Share is a modern, full-stack web application designed to combat food waste by connecting those with surplus food to those in need. It provides a real-time, map-based platform for users to post, discover, and claim food items in their local community, complete with a user reputation system and live chat to facilitate smooth and trustworthy exchanges.

![Demo Screenshot](https://source.unsplash.com/random/800x400/?food,community)

---

## Features

-   **Real-Time Feed & Map:** Discover nearby food posts instantly on a live-updating list or an interactive map.
-   **Geolocation:** Automatically uses your location to find the closest available items.
-   **User Authentication:** Secure registration and login using JWT (JSON Web Tokens).
-   **Post Management:** Users can easily create, edit, and delete their own food posts.
-   **Claim & Completion System:** A full workflow for users to claim an item, mark the transaction as complete, and provide feedback.
-   **Live Chat:** Once an item is claimed, a private, real-time chat room is created between the donor and claimer to coordinate pickup.
-   **Reputation System:** Users can rate each other after a completed transaction, building a community of trust.
-   **Admin Dashboard:** A comprehensive dashboard for administrators to manage all users and posts on the platform.
-   **Automated Expiry:** A backend cron job automatically marks posts as "expired" after their set expiry date.
-   **Responsive Design:** A beautiful and consistent UI that works on all screen sizes.

---

## Technology Stack

-   **Frontend:** React, Vite, React Bootstrap, Leaflet.js, Socket.IO Client
-   **Backend:** Node.js, Express.js, MongoDB, Mongoose
-   **Real-time:** Socket.IO
-   **Authentication:** JWT, bcryptjs

---

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js and npm](https://nodejs.org/)
-   [MongoDB](https://www.mongodb.com/try/download/community) (ensure the MongoDB service is running)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd food-supply
```

### 2. Backend Setup

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:** Create a file named `.env` in the `server` directory and add the following content. You can change the `JWT_SECRET` to any random string.

    ```ini
    # MongoDB connection string
    MONGO_URI=mongodb://localhost:27017/food-supply-db

    # Server port
    PORT=5000

    # JWT Secret for signing tokens
    JWT_SECRET=your_super_secret_string
    ```

4.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The server will be running on `http://localhost:5000` and connected to your local MongoDB.

### 3. Frontend Setup

1.  **Open a new terminal** and navigate to the client directory:
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend server:**
    ```bash
    npm run dev
    ```
    The frontend development server will start, usually on `http://localhost:5173`.

### 4. Access the Application

Open your web browser and navigate to **`http://localhost:5173`**. You can now register a new user, log in, and begin using the application!
