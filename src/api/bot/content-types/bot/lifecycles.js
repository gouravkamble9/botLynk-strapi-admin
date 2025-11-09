'use strict';

const crypto = require('crypto');

/**
 * Generate a random secret key
 * @returns {string} A random 64-character hexadecimal string
 */
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Generate a new secret key if one isn't provided
    if (!data.secretKey) {
      data.secretKey = generateSecretKey();
    }
    
    // Set status to 'active' if not provided
    if (!data.status) {
      data.status = 'active';
    }
  },
  
  async beforeUpdate(event) {
    const { data } = event.params;
    
    // If updating a bot and no secret key exists, generate one
    if (data && !data.secretKey) {
      const existingBot = await strapi.entityService.findOne('api::bot.bot', event.params.where.id);
      if (!existingBot.secretKey) {
        data.secretKey = generateSecretKey();
      }
    }
  }
};
