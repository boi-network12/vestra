// utils/linkPreview.js
const { getLinkPreview } = require('link-preview-js');

const generateLinkPreview = async (url) => {
  try {
    const data = await getLinkPreview(url);
    return {
      url: data.url,
      title: data.title || '',
      description: data.description || '',
      image: data.images && data.images.length > 0 ? data.images[0] : '',
      siteName: data.siteName || ''
    };
  } catch (error) {
    console.error('Error generating link preview:', error);
    return null;
  }
};

module.exports = { generateLinkPreview };