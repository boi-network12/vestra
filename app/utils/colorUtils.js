// utils/colorUtils.js
export const withOpacity = (hexColor, opacityPercent) => {
  // Remove "#" if present
  const hex = hexColor.replace("#", "");
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convert percentage to decimal (0 - 1)
  const alpha = Math.max(0, Math.min(1, opacityPercent / 100));

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
