import { createChatBotMessage } from 'react-chatbot-kit';


const botName = 'Daleel';


const config = {
    initialMessages: [createChatBotMessage(`Hey 👋, I'm ${botName}`)],
    botName: botName,
    // customStyles: {
    //     botMessageBox: {
    //         backgroundColor: '#2436A7FF',
    //     },
    //     chatButton: {
    //         backgroundColor: '#5C98CCFF',
    //     },
    // },
};

export default config;