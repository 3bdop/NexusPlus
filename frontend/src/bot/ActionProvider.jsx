import React from 'react';
import { apiClient } from '../api/client';

import formatMessage from '../utils/formatMessage';

const ActionProvider = ({ createChatBotMessage, setState, children }) => {
    const handleUserMessage = async (query) => {
        // Add loading message
        setState((prev) => ({
            ...prev,
            messages: [...prev.messages, createChatBotMessage('Processing...')],
        }));

        try {
            const response = await apiClient.post('/query', {
                query
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Format the response with dynamic bold text
            const formattedMessage = formatMessage(response.data.response);

            const botMessage = createChatBotMessage(
                <div className="formatted-response">{formattedMessage}</div>,
                { delay: 500 }
            );

            // Remove loading message and add actual response
            setState((prev) => {
                const messages = [...prev.messages];
                messages.pop(); // Remove loading message
                return {
                    ...prev,
                    messages: [
                        ...messages,
                        createChatBotMessage(response.data.response || "I couldn't understand that"),
                    ],
                };
            });
        } catch (error) {
            console.error('Error:', error);
            setState((prev) => ({
                ...prev,
                messages: [...prev.messages,
                createChatBotMessage(error.response?.data?.error || 'Sorry, something went wrong.')
                ],
            }));
        }
    };

    return (
        <div>
            {React.Children.map(children, (child) => {
                return React.cloneElement(child, {
                    actions: {
                        handleUserMessage,
                    },
                });
            })}
        </div>
    );
};

export default ActionProvider;