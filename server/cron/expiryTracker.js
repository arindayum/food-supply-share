import cron from 'node-cron';
import FoodItem from '../models/FoodItem.js';
import FoodPost from '../models/FoodPost.js';

/**
 * This function schedules a cron job to run periodically and update the status
 * of food items and posts that have passed their expiration date.
 */
const startExpiryTracker = () => {
  // Schedule the job to run every 10 minutes.
  cron.schedule('*/10 * * * *', async () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Running scheduled job: Checking for expired items...`);

    try {
      // Find and update available FoodItems that have expired
      const itemResult = await FoodItem.updateMany(
        { status: 'available', expiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
      );

      // Find and update available FoodPosts that have expired
      const postResult = await FoodPost.updateMany(
        { status: 'available', expiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
      );

      const totalExpired = (itemResult.modifiedCount || 0) + (postResult.modifiedCount || 0);

      if (totalExpired > 0) {
        console.log(`[Expiry Job] Successfully marked ${totalExpired} item(s)/post(s) as expired.`);
      } else {
        console.log('[Expiry Job] No items or posts to expire on this run.');
      }
    } catch (error) {
      console.error('[Expiry Job] Error while checking for expired items:', error);
    }
  });

  console.log('✅ Expiry tracker job has been scheduled to run every hour.');
};

export default startExpiryTracker;
