import React, { useState, FormEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  answerMode: 'short' | 'detailed';
  onAnswerModeChange: (mode: 'short' | 'detailed') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, answerMode, onAnswerModeChange }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="p-4 border-t border-gray-300 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="answerMode"
            value="short"
            checked={answerMode === 'short'}
            onChange={() => onAnswerModeChange('short')}
          />
          Short
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="answerMode"
            value="detailed"
            checked={answerMode === 'detailed'}
            onChange={() => onAnswerModeChange('detailed')}
          />
          Detailed
        </label>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "No knowledge base loaded." : "Type your question..."}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={disabled}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
