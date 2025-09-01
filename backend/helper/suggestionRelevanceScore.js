// suggestionRelevanceScore.js
const Post = require('../models/Post');
const User = require('../models/User');
const { haversineDistance } = require("../utils/geoUtils")

exports.calculateRelevanceScore = async (currentUser, targetUser) => {
  let score = 1;

  // 1. Mutual Followers (Network Analysis)
  const mutualFollowers = currentUser.following.filter(followingId =>
    targetUser.followers.includes(followingId)
  ).length;
  score += mutualFollowers * 20;

  // 2. Shared Interests
  const sharedInterests = currentUser.profile.interests.filter(interest =>
    targetUser.profile.interests.includes(interest)
  ).length;
  score += sharedInterests * 10;

  // 3. Geographical Proximity (using Haversine formula)
  if (
    currentUser.profile.location?.coordinates?.length &&
    targetUser.profile.location?.coordinates?.length
  ) {
    const [currLon, currLat] = currentUser.profile.location.coordinates;
    const [targetLon, targetLat] = targetUser.profile.location.coordinates;
    const distance = haversineDistance(currLat, currLon, targetLat, targetLon); // in kilometers
    if (distance < 10) score += 15; // Within 10km
    else if (distance < 50) score += 5; // Within 50km
  }

  // 4. Cultural Background
  if (
    currentUser.profile.culturalBackground === targetUser.profile.culturalBackground &&
    currentUser.profile.culturalBackground !== 'Prefer not to say'
  ) {
    score += 10;
  }

  // 5. Engagement-Based Scoring (likes, comments, messages)
  const interactions = await Post.aggregate([
    {
      $match: {
        userId: targetUser._id,
        $or: [
          { likes: currentUser._id },
          { 'comments.userId': currentUser._id },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: { $cond: [{ $in: [currentUser._id, '$likes'] }, 1, 0] } },
        totalComments: { $sum: { $size: '$comments' } },
      },
    },
  ]);

  const engagementScore = (interactions[0]?.totalLikes || 0) * 5 + (interactions[0]?.totalComments || 0) * 10;
  score += engagementScore;

  // 6. Temporal Decay (recent activity)
  const recentActivity = await Post.findOne({
    userId: targetUser._id,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
  });
  if (recentActivity) score += 10;

  // 7. Second-Degree Connections (friends of friends)
  const secondDegreeConnections = await User.find({
    _id: { $in: targetUser.following },
    following: currentUser._id,
  }).countDocuments();
  score += secondDegreeConnections * 5;

  return score;
};
