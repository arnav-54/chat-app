# Render Deployment Guide

This guide will help you deploy your Chat App to Render, separating the **Frontend** (Static Site) and **Backend** (Web Service) for better performance and scalability.

## Prerequisites

1.  A [GitHub](https://github.com/) account with this repository pushed.
2.  A [Render](https://render.com/) account.
3.  A [MongoDB Atlas](https://www.mongodb.com/atlas) account (or any MongoDB provider).

---

## Part 1: Database Setup (MongoDB Atlas)

Since you are using Prisma with MongoDB, you need a MongoDB connection string.

1.  Log in to MongoDB Atlas and create a new Cluster (Free tier works).
2.  Create a Database User (Username/Password).
3.  Allow "Access from Anywhere" (0.0.0.0/0) in Network Access (Render IPs vary).
4.  Get your Connection String (e.g., `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chat-app`).

---

## Part 2: Backend Deployment

1.  On Render Dashboard, click **New +** and select **Web Service**.
2.  Connect your GitHub repository.
3.  Configure the service:
    *   **Name**: `chat-app-backend` (or similar)
    *   **Root Directory**: `server`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
4.  Scroll down to **Environment Variables** and add:
    *   `NODE_ENV`: `production`
    *   `DATABASE_URL`: Your MongoDB Connection String.
    *   `JWT_SECRET`: A secure random string.
    *   `CLOUDINARY_CLOUD_NAME`: (If used)
    *   `CLOUDINARY_API_KEY`: (If used)
    *   `CLOUDINARY_API_SECRET`: (If used)
    *   `CLIENT_URL`: `http://localhost:3000` (Temporary, we will update this after deploying frontend).
5.  Click **Create Web Service**.
6.  Wait for the deployment to finish. Copy the **Service URL** (e.g., `https://chat-app-backend.onrender.com`).

---

## Part 3: Frontend Deployment

1.  On Render Dashboard, click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  Configure the static site:
    *   **Name**: `chat-app-client`
    *   **Root Directory**: `client`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `build`
4.  Scroll down to **Environment Variables** and add:
    *   `REACT_APP_BACKEND_URL`: The Backend Service URL from Part 2 (e.g., `https://chat-app-backend.onrender.com`). **Do not add `/api` at the end.**
5.  Click **Create Static Site**.
6.  Wait for deployment. Copy the **Site URL** (e.g., `https://chat-app-client.onrender.com`).
7.  **IMPORTANT**: Go to the **Redirects/Rewrites** tab for your new Static Site.
    *   Click **Add Rule**.
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: `Rewrite`
    *   Click **Save Changes**. (This ensures that refreshing pages like `/login` or `/chat` works correctly).

---

## Part 4: Final Configuration

1.  Go back to your **Backend Service** on Render.
2.  Go to the **Environment** tab.
3.  Update the `CLIENT_URL` variable:
    *   **Value**: Your new Frontend Site URL (e.g., `https://chat-app-client.onrender.com`).
4.  **Save Changes**. Render will automatically redeploy the backend.
5.  Once finished, open your Frontend URL and your app should be working with separate deployments!

---

## Troubleshooting

### "My App is taking a long time to load!"

If you are using the **Free Tier** on Render for your Backend Web Service, it will automatically "sleep" after 15 minutes of inactivity.
*   When you open your app after a break, the backend might take **50-60 seconds** to wake up.
*   Frontend loading spinners might hang during this time.
*   This is normal for the Free Tier. Upgrading to a paid instance ($7/mo) removes this delay.
