import { createChatBotMessage } from 'react-chatbot-kit';


const botName = 'Daleel';


const config = {
    initialMessages: [createChatBotMessage(`Hello, I'm ${botName}`)],
    botName: botName,
    customStyles: {
        botMessageBox: {
            backgroundColor: '#376B7E',
        },
        chatButton: {
            backgroundColor: '#5ccc9d',
        },
    },
    initialMessages: [createChatBotMessage(`Hey 👋, I'm ${botName} how can I help you with UDST career fair?`)],
    botName: botName,
};

export default config;