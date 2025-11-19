import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import FoodPost from '../models/FoodPost.js';
import FoodItem from '../models/FoodItem.js';

const router = express.Router();

// All routes in this file are protected and for admins only
// The authorize('admin') middleware ensures only users with the 'admin' role can proceed.
router.use(protect, authorize('admin'));

// @desc    Get application stats
// @route   GET /api/admin/stats
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const postCount = await FoodPost.countDocuments();
        const itemCount = await FoodItem.countDocuments();
        const completedTransactions = await FoodPost.countDocuments({ status: 'completed' }) + await FoodItem.countDocuments({ status: 'completed' });

        res.json({
            users: { count: userCount, label: 'Total Users' },
            posts: { count: postCount + itemCount, label: 'Total Posts' },
            completed: { count: completedTransactions, label: 'Completed Transactions' },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching stats' });
    }
});


// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;

    try {
        const count = await User.countDocuments();
        const users = await User.find({})
            .select('-passwordHash')
            .limit(pageSize)
            .skip(pageSize * (page - 1));
        
        res.json({ users, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching users' });
    }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            // In a real app, you might want to handle their posts/items as well
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting user' });
    }
});

// @desc    Get all food posts with filtering
// @route   GET /api/admin/posts
// @access  Admin
router.get('/posts', async (req, res) => {
    const { status, ownerEmail } = req.query;
    let filter = {};

    if (status) {
        filter.status = status;
    }

    if (ownerEmail) {
        try {
            const user = await User.findOne({ email: { $regex: ownerEmail, $options: 'i' } });
            if (user) {
                filter.owner = user._id;
            } else {
                // If no user matches, return no posts
                return res.json([]);
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error finding user by email.' });
        }
    }

    try {
        const posts = await FoodPost.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching posts' });
    }
});

// @desc    Delete any post
// @route   DELETE /api/admin/posts/:id
// @access  Admin
router.delete('/posts/:id', async (req, res) => {
    try {
        const post = await FoodPost.findById(req.params.id);
        if (post) {
            await post.deleteOne();
            res.json({ message: 'Post removed' });
        } else {
            // Try finding in FoodItems if not in FoodPosts
            const item = await FoodItem.findById(req.params.id);
            if (item) {
                await item.deleteOne();
                res.json({ message: 'Item removed' });
            } else {
                res.status(404).json({ message: 'Content not found' });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting content' });
    }
});

export default router;
