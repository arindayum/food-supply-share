import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import foodItemRoutes from './routes/foodItems.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import ratingsRoutes from './routes/ratings.js';
import startExpiryTracker from './cron/expiryTracker.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import FoodPost from './models/FoodPost.js';
import FoodItem from './models/FoodItem.js'; // only if you still support FoodItem chats

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Start background jobs
startExpiryTracker();

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/fooditems', foodItemRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ratings', ratingsRoutes);

// --- Socket.IO Integration ---
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your client's URL
    methods: ["GET", "POST"]
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  // Token can be passed in auth payload or as a query parameter
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }
    socket.user = user; // Attach user to the socket object
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token.'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.user.name} (${socket.id})`);

  // Automatically join user to their own room and the global post feed
  socket.join(`user:${socket.user.id}`);
  socket.join('postFeed');

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`[Socket.IO] User ${socket.user.name} left room: ${roomId}`);
  });

  // Handler for joining a specific chat room
  socket.on('joinChatRoom', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`[Socket.IO] User ${socket.user.name} joined chat room: chat:${chatId}`);
  });

  socket.on('leaveChatRoom', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`[Socket.IO] User ${socket.user.name} left room: chat:${chatId}`);
  });

  // socket.on('sendMessage', async ({ conversationId, text, roomId }) => {
  //   try {
  //     const message = new Message({
  //       conversationId,
  //       sender: socket.user.id,
  //       text,
  //     });
  //     const savedMessage = await message.save();
  //     const populatedMessage = await savedMessage.populate('sender', 'name');

  //     // Emit the new message to the specific chat room
  //     io.to(`chat:${roomId}`).emit('new_message', populatedMessage);
  //   } catch (error) {
  //     console.error('[Socket.IO] Error handling sendMessage:', error);
  //     socket.emit('error', { message: 'Failed to send message.' });
  //   }
  // });


socket.on(
  'sendMessage',
  async ({ conversationId, text, roomId, postModel = 'FoodPost' }) => {
    try {
      if (!text || !roomId) return;

      // Decide which model to use (FoodPost vs FoodItem)
      const PostModel = postModel === 'FoodItem' ? FoodItem : FoodPost;

      let convId = conversationId;

      // If there is no conversation yet, find or create it
      if (!convId) {
        const post = await PostModel.findById(roomId);
        if (!post) {
          console.warn('[Socket.IO] Post not found for roomId:', roomId);
          return;
        }

        const ownerId = post.owner;        // FoodPost uses "owner"
        const claimerId = post.claimedBy;  // set when user claims the post

        if (!claimerId) {
          console.log(
            '[Socket.IO] No claimer yet, cannot create conversation for this post.'
          );
          return;
        }

        let conversation = await Conversation.findOne({
          relatedPostId: roomId,
          postModel,
        });

        if (!conversation) {
          conversation = new Conversation({
            relatedPostId: roomId,
            postModel,
            participants: [ownerId, claimerId],
          });
          await conversation.save();
        }

        convId = conversation._id;
      }

      // We now definitely have a conversationId
      const message = new Message({
        conversationId: convId,
        sender: socket.user.id,
        text,
      });

      const savedMessage = await message.save();
      const populatedMessage = await savedMessage.populate('sender', 'name');

      // Emit the new message to everyone in this chat room
      io.to(`chat:${roomId}`).emit('new_message', populatedMessage);
    } catch (error) {
      console.error('[Socket.IO] Error handling sendMessage:', error);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  }
);



  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.user.name} (${socket.id})`);
  });
});


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
