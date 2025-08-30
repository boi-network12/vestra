

// Helper function to calculate user relevance score for suggestions
exports.calculateRelevanceScore = (currentUser, targetUser) => {
  let score = 0;

  // Mutual followers (higher weight)
  const mutualFollowers = currentUser.following.filter(followingId =>
    targetUser.followers.includes(followingId)
  ).length;
  score += mutualFollowers * 20;

  // Shared interests
  const sharedInterests = currentUser.profile.interests.filter(interest =>
    targetUser.profile.interests.includes(interest)
  ).length;
  score += sharedInterests * 10;

  // Location proximity (if coordinates exist)
  if (
    currentUser.profile.location?.coordinates?.length &&
    targetUser.profile.location?.coordinates?.length
  ) {
    const [currLon, currLat] = currentUser.profile.location.coordinates;
    const [targetLon, targetLat] = targetUser.profile.location.coordinates;
    const distance = Math.sqrt(
      Math.pow(currLon - targetLon, 2) + Math.pow(currLat - targetLat, 2)
    );
    if (distance < 0.1) score += 15; // Close proximity
    else if (distance < 0.5) score += 5; // Moderate proximity
  }

  // Cultural background match
  if (
    currentUser.profile.culturalBackground === targetUser.profile.culturalBackground &&
    currentUser.profile.culturalBackground !== 'Prefer not to say'
  ) {
    score += 10;
  }

  return score;
};