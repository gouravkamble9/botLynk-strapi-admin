'use strict';

const { GoogleGenAI } = require('@google/genai');

module.exports = {
  /**
   * Get bot details by secret key and website
   * @param {Object} ctx - Koa context
   */
  async getBotDetails(ctx) {
    try {
      const { secretKey, website } = ctx.query;

      if (!secretKey || !website) {
        return ctx.badRequest('Missing required query parameters: secretKey and website are required');
      }

      // Find bot by secret key and website
      const bot = await strapi.db.query('api::bot.bot').findOne({
        where: { 
          secretKey,
          website,
          status: 'active'
        },
        select: ['name', 'primaryColor','status'] // Only select required fields
      });

      if (!bot) {
        return ctx.notFound('No active bot found with the provided credentials');
      }

      return {
        success: true,
        data: {
          name: bot.name,
          primaryColor: bot.primaryColor,
          status: bot.status,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching bot details:', error);
      return ctx.internalServerError('Failed to fetch bot details');
    }
  },

  async sendMessage(ctx) {
    try {
      const { secretKey, website, message } = ctx.request.body;

      if (!secretKey || !website || !message) {
        return ctx.badRequest('Missing required fields: secretKey, website, and message are required');
      }

      // Find bot by secret key
      const bot = await strapi.db.query('api::bot.bot').findOne({
        where: { 
          secretKey,
          status: 'active'
        },
        populate: ['users_permissions_user']
      });

      if (!bot) {
        return ctx.unauthorized('Invalid secret key or bot is inactive');
      }

      // Verify website URL matches
      if (bot.website !== website) {
        return ctx.send({
          success: false,
          message: 'This bot is not configured for the specified website',
          timestamp: new Date().toISOString()
        });
      }

      try {
        // Generate response using Gemini
        
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY
        });
        
        // Using the latest model
        const model = "gemini-2.5-flash";
        
        const prompt = `${bot.knowledgeBase} Provide a concise response based on the knowledge base only. Limit your reply to a maximum of 50 words, ensuring clarity and relevance to the query. Note: Only give answers which are related to knowledgebase. Strictly don't give answers outside of knowledgebase`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        
        ctx.send({
          success: true,
          data: {
            message: response.text,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('AI Generation Error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          stack: error.stack
        });
        
        let errorMessage = 'Sorry, I encountered an error while processing your request. Please try again later.';
        
        if (error.status === 404) {
          errorMessage = 'The AI service is currently unavailable. Please try again later.';
        } else if (error.status === 403) {
          errorMessage = 'Authentication failed. Please check your API key and try again.';
        }
        
        ctx.send({
          success: false,
          message: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      ctx.internalServerError('Failed to process message');
    }
  }
};