// utils/formatMessage.jsx
import React from 'react';

const formatMessage = (message) => {
  const parts = message.split(/(\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default formatMessage;