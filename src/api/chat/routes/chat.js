module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chat/message',
      handler: 'chat.sendMessage',
      config: {
        auth: false, // Public endpoint
      },
    },
    {
      method: 'GET',
      path: '/chat/bot-details',
      handler: 'chat.getBotDetails',
      config: {
        auth: false, // Public endpoint
      },
    },
  ],
};
