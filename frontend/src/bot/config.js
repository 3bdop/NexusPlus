import { createChatBotMessage } from 'react-chatbot-kit';


const botName = 'Daleel';


const config = {
    initialMessages: [createChatBotMessage(`Hey 👋, I'm ${botName} how can I help you with UDST career fair?`)],
    botName: botName,
};

export default config;