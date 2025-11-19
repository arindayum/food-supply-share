import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import FoodPost from '../models/FoodPost.js';
import { io } from '../index.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';

const router = express.Router();

// @desc    Get food posts - show available + claimed (but not completed)
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  const { lat, lng, radiusKm } = req.query;
  const radius = parseFloat(radiusKm) || 10; // Default to 10km

  try {
    let query = {
      status: { $in: ['available', 'claimed'] },
      expiresAt: { $gt: new Date() },
    };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius * 1000, // meters
        }
      };
    }

    const posts = await FoodPost.find(query)
      .populate('owner', 'name postsCompleted rating ratingCount');

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Create a new food post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
  const { title, description, quantity, category, address, location, expiresAt } = req.body;

  try {
    const newPost = new FoodPost({
      title,
      description,
      quantity,
      category,
      address,
      location,
      expiresAt,
      owner: req.user.id,
    });

    const post = await newPost.save();
    const populatedPost = await post.populate('owner', 'name postsCompleted rating ratingCount');

    io.emit('new_post', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ message: 'Failed to create post', error: error.message });
  }
});

// @desc    Get posts created by the logged-in user
// @route   GET /api/posts/my-posts
// @access  Private
router.get('/my-posts', protect, async (req, res) => {
  try {
    const posts = await FoodPost.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get a single food post by ID
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id).populate('owner', 'name email rating ratingCount');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @desc    Update a food post
// @route   PUT /api/posts/:id
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    const updatedPost = await FoodPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name postsCompleted rating ratingCount');

    io.emit('post_update', updatedPost);
    res.json(updatedPost);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ message: 'Failed to update post', error: error.message });
  }
});

// @desc    Delete a food post
// @route   DELETE /api/posts/:id
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    const postId = post._id;
    await post.deleteOne();

    io.emit('post_delete', { _id: postId });

    res.json({ success: true, message: 'Post successfully deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});
  
// @desc    Claim a food post
// @route   POST /api/posts/:id/claim
// @access  Private
router.post('/:id/claim', protect, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own post.' });
    }

    if (post.status !== 'available') {
      return res.status(400).json({ message: `This post is already ${post.status}.` });
    }

    post.status = 'claimed';
    post.claimedBy = req.user.id;

    const updatedPost = await post.save();
    const populatedPost = await updatedPost.populate('owner', 'name email rating ratingCount');

    io.emit('post_update', populatedPost);

    res.json(populatedPost);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});
      
// @desc    Mark a claimed post as completed
// @route   POST /api/posts/:id/complete
// @access  Private (claimer only)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.claimedBy || post.claimedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to complete this transaction' });
    }

    if (post.status !== 'claimed') {
      return res.status(400).json({ message: 'This post must be in a "claimed" state to be completed.' });
    }

    post.status = 'completed';

    await User.findByIdAndUpdate(post.owner, { $inc: { postsCompleted: 1 } });

    const savedPost = await post.save();
    const populatedPost = await FoodPost.findById(savedPost._id).populate('owner', 'name email rating ratingCount');

    io.emit('post_update', populatedPost);

    res.json(populatedPost);
  } catch (error) {
    console.error('Complete post error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});
          
// @desc    Rate the donor of a post
// @route   POST /api/posts/:id/rate
// @access  Private (claimer only, after completion)
router.post('/:id/rate', protect, async (req, res) => {
  const { stars, comment } = req.body;
  const postId = req.params.id;
  const raterId = req.user.id;

  try {
    const post = await FoodPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.status !== 'completed') {
      return res.status(400).json({ message: 'Post must be completed to be rated.' });
    }
    if (!post.claimedBy || post.claimedBy.toString() !== raterId) {
      return res.status(401).json({ message: 'Only the user who claimed this item can rate it.' });
    }

    const existingRating = await Rating.findOne({ post: postId, rater: raterId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this transaction.' });
    }

    const numericStars = Math.min(5, Math.max(1, Number(stars)));

    const rating = new Rating({
      post: postId,
      rater: raterId,
      ratee: post.owner,
      stars: numericStars,
      comment: comment || '',
    });
    await rating.save();

    const donor = await User.findById(post.owner);
    const currentRating = Number(donor.rating) || 0;
    const currentCount = Number(donor.ratingCount) || 0;

    const oldTotal = currentRating * currentCount;
    const newCount = currentCount + 1;
    const newAverage = (oldTotal + numericStars) / newCount;

    donor.rating = Number(newAverage.toFixed(2));
    donor.ratingCount = newCount;
    await donor.save();

    io.to(`user:${donor._id}`).emit('rating_updated', {
      _id: donor._id.toString(),
      rating: donor.rating,
      ratingCount: donor.ratingCount,
    });

    res.status(201).json({
      message: 'Rating submitted successfully.',
      donor: {
        _id: donor._id,
        name: donor.name,
        rating: donor.rating,
        ratingCount: donor.ratingCount,
      },
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;