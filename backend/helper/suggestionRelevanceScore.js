// suggestionRelevanceScore.js
exports.calculateRelevanceScore = (currentUser, targetUser) => {
  let score = 1;

  const mutualFollowers = currentUser.following.filter(followingId =>
    targetUser.followers.includes(followingId)
  ).length;
  score += mutualFollowers * 20;

  const sharedInterests = currentUser.profile.interests.filter(interest =>
    targetUser.profile.interests.includes(interest)
  ).length;
  score += sharedInterests * 10;

  if (
    currentUser.profile.location?.coordinates?.length &&
    targetUser.profile.location?.coordinates?.length
  ) {
    const [currLon, currLat] = currentUser.profile.location.coordinates;
    const [targetLon, targetLat] = targetUser.profile.location.coordinates;
    const distance = Math.sqrt(
      Math.pow(currLon - targetLon, 2) + Math.pow(currLat - targetLat, 2)
    );
    if (distance < 0.1) score += 15;
    else if (distance < 0.5) score += 5;
  }

  if (
    currentUser.profile.culturalBackground === targetUser.profile.culturalBackground &&
    currentUser.profile.culturalBackground !== 'Prefer not to say'
  ) {
    score += 10;
  }

  return score;
};