import { createChatBotMessage } from 'react-chatbot-kit';


const botName = 'Daleel';


const config = {
    initialMessages: [createChatBotMessage(`Hey 👋, I'm ${botName}`)],
    botName: botName,
};

export default config;