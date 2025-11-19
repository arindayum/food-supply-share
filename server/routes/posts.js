import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import FoodPost from '../models/FoodPost.js';
import { io } from '../index.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';

const router = express.Router();

// // @desc    Get available food posts, with optional geospatial search
// // @route   GET /api/posts
// // @access  Public
// router.get('/', async (req, res) => {
//   const { lat, lng, radiusKm } = req.query;
//   // Default radius to 5km if not provided
//   const radius = parseFloat(radiusKm) || 5;

//   try {
//     // Base query: find available items that have not expired
//     let query = { status: 'available', expiresAt: { $gt: new Date() } };

//     // If location data is provided, add a geospatial filter
//     if (lat && lng) {
//       query.location = {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [parseFloat(lng), parseFloat(lat)],
//           },
//           // $maxDistance is in meters, so convert km to meters
//           $maxDistance: radius * 1000,
//         },
//       };
//     }

//     // The $near operator automatically sorts documents by distance.
//     const posts = await FoodPost.find(query).populate('owner', 'name postsCompleted');
//     res.json(posts);
//   } catch (error) {
//     console.error('Error fetching nearby posts:', error.message);
//     res.status(500).send('Server Error');
//   }
// });


// @desc    Get food posts - show available + claimed (but not completed)
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  const { lat, lng, radiusKm } = req.query;
  const radius = parseFloat(radiusKm) || 5;

  try {
    // Base: show all posts that are not completed and not expired
    let query = {
      status: { $ne: 'completed' }, // show available + claimed
      expiresAt: { $gt: new Date() },
    };

    // If user location provided → apply geospatial filter
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius * 1000,
        }
      };
    }

    const posts = await FoodPost.find(query)
      .populate('owner', 'name postsCompleted');

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
      owner: req.user.id, // Assign post to the logged-in user
    });

    const post = await newPost.save();
    const populatedPost = await post.populate('owner', 'name postsCompleted');

    // Emit the new post to the global feed
    io.to('postFeed').emit('new_post', populatedPost);

    res.status(201).json(post);
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
    const post = await FoodPost.findById(req.params.id).populate('owner', 'name email');
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

    // Verify that the user is the owner of the post
    if (post.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    post = await FoodPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(post);
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

    // Verify user is owner or an admin
    if (post.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

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
  
          res.json(updatedPost);
      } catch (error) {
          console.error(error.message);
          res.status(500).send('Server Error');
          }
      });
      
      // // @desc    Mark a claimed post as completed
      // // @route   POST /api/posts/:id/complete
      // // @access  Private (claimer only)
      // router.post('/:id/complete', protect, async (req, res) => {
      //     try {
      //         const post = await FoodPost.findById(req.params.id);
      
      //         if (!post) {
      //             return res.status(404).json({ message: 'Post not found' });
      //         }
      
      //         // Verify the user marking it complete is the one who claimed it
      //         if (!post.claimedBy || post.claimedBy.toString() !== req.user.id) {
      //             return res.status(401).json({ message: 'Not authorized to complete this transaction' });
      //         }
      
      //         if (post.status !== 'claimed') {
      //             return res.status(400).json({ message: 'This post must be in a "claimed" state to be completed.' });
      //         }
      
      //         post.status = 'completed';
      
      //         // Increment the post owner's completed posts count
      //         await User.findByIdAndUpdate(post.owner, { $inc: { postsCompleted: 1 } });
      
      //         const updatedPost = await post.save();
      //         res.json(updatedPost);
      
      //     } catch (error) {
      //         console.error(error.message);
      //         res.status(500).send('Server Error');
      //         }
      //     });
          
// @desc    Mark a claimed post as completed
// @route   POST /api/posts/:id/complete
// @access  Private (claimer only)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only the user who claimed the item can complete it
    if (!post.claimedBy || post.claimedBy.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: 'Not authorized to complete this transaction' });
    }

    if (post.status !== 'claimed') {
      return res
        .status(400)
        .json({ message: 'This post must be in a "claimed" state to be completed.' });
    }

    // Mark post as completed
    post.status = 'completed';

    // Increment the donor's completed posts count
    await User.findByIdAndUpdate(post.owner, { $inc: { postsCompleted: 1 } });

    const saved = await post.save();

    // Return a populated version for frontend UI
    const updatedPost = await FoodPost.findById(saved._id).populate(
      'owner',
      'name email rating ratingCount postsCompleted'
    );

    res.json(updatedPost);
  } catch (error) {
    console.error('Complete post error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});



          // // @desc    Rate the donor of a post
          // // @route   POST /api/posts/:id/rate
          // // @access  Private (claimer only, after completion)
          // router.post('/:id/rate', protect, async (req, res) => {
          //     const { stars, comment } = req.body;
          //     const postId = req.params.id;
          //     const raterId = req.user.id;
          
          //     try {
          //         const post = await FoodPost.findById(postId);
          
          //         if (!post) {
          //             return res.status(404).json({ message: 'Post not found.' });
          //         }
          //         if (post.status !== 'completed') {
          //             return res.status(400).json({ message: 'Post must be completed to be rated.' });
          //         }
          //         if (post.claimedBy.toString() !== raterId) {
          //             return res.status(401).json({ message: 'Only the user who claimed the item can rate it.' });
          //         }
          
          //         // Check if a rating already exists
          //         const existingRating = await Rating.findOne({ post: postId, rater: raterId });
          //         if (existingRating) {
          //             return res.status(400).json({ message: 'You have already rated this transaction.' });
          //         }
          
          //         // Create the new rating
          //         const rating = new Rating({
          //             post: postId,
          //             rater: raterId,
          //             ratee: post.owner,
          //             stars: Number(stars),
          //             comment,
          //         });
          //         await rating.save();
          
          //         // Update the donor's aggregate rating
          //         const donor = await User.findById(post.owner);
          //         const oldRatingTotal = donor.rating * donor.ratingCount;
          //         const newRatingCount = donor.ratingCount + 1;
          //         const newAverageRating = (oldRatingTotal + Number(stars)) / newRatingCount;
          
          //         donor.rating = newAverageRating;
          //         donor.ratingCount = newRatingCount;
          //         await donor.save();


                  
          
          //         res.status(201).json({ message: 'Rating submitted successfully.' });
          
          //     } catch (error) {
          //         console.error('Rating submission error:', error);
          //         res.status(500).send('Server Error');
          //     }
          // });
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

    // only the claimer can rate after completion
    if (post.status !== 'completed') {
      return res.status(400).json({ message: 'Post must be completed to be rated.' });
    }
    if (!post.claimedBy || post.claimedBy.toString() !== raterId) {
      return res.status(401).json({ message: 'Only the user who claimed this item can rate it.' });
    }

    // Prevent duplicate ratings
    const existingRating = await Rating.findOne({ post: postId, rater: raterId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this transaction.' });
    }

    // Sanitize stars
    const numericStars = Math.min(5, Math.max(1, Number(stars)));

    // Create the rating document
    const rating = new Rating({
      post: postId,
      rater: raterId,
      ratee: post.owner,
      stars: numericStars,
      comment: comment || '',
    });
    await rating.save();

    // Update donor aggregate safely
    const donor = await User.findById(post.owner);
    const currentRating = Number(donor.rating) || 0;
    const currentCount = Number(donor.ratingCount) || 0;

    const oldTotal = currentRating * currentCount;
    const newCount = currentCount + 1;
    const newAverage = (oldTotal + numericStars) / newCount;

    donor.rating = Number(newAverage.toFixed(2));
    donor.ratingCount = newCount;
    await donor.save();

    // Emit realtime update to donor's connected sockets (if any)
    try {
      io.to(`user:${donor._id}`).emit('rating_updated', {
        _id: donor._id.toString(),
        rating: donor.rating,
        ratingCount: donor.ratingCount,
      });
    } catch (e) {
      console.warn('Failed to emit rating_updated via socket:', e.message);
    }

    // Return donor summary + success
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
          
