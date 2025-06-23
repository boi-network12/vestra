const config = require("../config")
const CryptoJS = require("crypto-js")

// Generate consistent encryption key for a user pair
const generateKey = (userId1, userId2) => {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required for key generation');
  }
  
  // Always sort the IDs to ensure consistent key generation
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  const combined = sortedIds.join('_') + config.ENCRYPTION_SALT;
  return CryptoJS.SHA256(combined).toString();
};

exports.encryptMessage = (message, senderId, recipientId) => {
  try {
    if (!senderId || !recipientId) {
      throw new Error('Missing required user IDs for encryption');
    }

    const key = generateKey(senderId, recipientId);

    if (typeof message === 'object') {
      // Encrypt only the text content if it exists
      const encryptedData = {
        ...message,
        encrypted: true
      };
      
      if (message.text) {
        encryptedData.text = CryptoJS.AES.encrypt(message.text, key).toString();
      }
      return encryptedData;
    } else if (typeof message === 'string') {
      // Simple string encryption
      return CryptoJS.AES.encrypt(message, key).toString();
    }
    
    throw new Error('Invalid message format for encryption');
  } catch (error) {
    console.error('Encryption error:', error);
    return message; // Fallback to original message
  }
};

exports.decryptMessage = (encrypted, userId1, userId2) => {
  try {
    if (!userId1 || !userId2) {
      throw new Error('Missing required user IDs for decryption');
    }

    if (!encrypted) {
      console.error('No encrypted content provided');
      throw new Error('No encrypted content provided');
    }

    // If not encrypted, return as-is
    if (typeof encrypted === 'object' && !encrypted.encrypted) {
      return encrypted;
    }

    const key = generateKey(userId1, userId2);

    if (typeof encrypted === 'object') {
      // Decrypt message object
      const decryptedData = {...encrypted};
      
      if (encrypted.text) {
        const bytes = CryptoJS.AES.decrypt(encrypted.text, key);
        decryptedData.text = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedData.text) {
          console.error('Decryption failed - possible key mismatch', {
            encrypted: encrypted.text,
            key,
            userId1,
            userId2
          });
          throw new Error('Failed to decrypt message text - key mismatch?');
        }
      }
      
      return decryptedData;
    } else if (typeof encrypted === 'string') {
      // Decrypt simple string
      const bytes = CryptoJS.AES.decrypt(encrypted, key);
      return bytes.toString(CryptoJS.enc.Utf8) || encrypted;
    }

    throw new Error('Invalid encrypted message format');
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted; // Fallback to original encrypted data
  }
};