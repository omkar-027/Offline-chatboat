import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import ChatHistory from './components/ChatHistory';
import ChatInput from './components/ChatInput';
import LoginForm from './components/LoginForm';
import { Message, KnowledgeBase } from './types';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [answerMode, setAnswerMode] = useState<'short' | 'detailed'>('short');

  // Load knowledge base from localStorage
  useEffect(() => {
    const savedKB = localStorage.getItem('globalKnowledgeBase');
    if (savedKB) {
      try {
        const parsedKB = JSON.parse(savedKB);
        setKnowledgeBase({ ...parsedKB, uploadDate: new Date(parsedKB.uploadDate) });
      } catch (err) {
        console.error('Error loading knowledge base:', err);
      }
    }
  }, []);

  // Load welcome message
  useEffect(() => {
    if (user && knowledgeBase) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: user.role === 'admin'
          ? `Welcome Admin! 🛡️\nSelect "Short" or "Detailed" answer mode.\nCurrent KB: "${knowledgeBase.filename}"`
          : `Welcome! 🎉\nYou can get answers in Short or Detailed mode.\nBased on: "${knowledgeBase.filename}"`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user, knowledgeBase]);

  // Admin file upload
  const handleFileUpload = useCallback((newKB: KnowledgeBase) => {
    setKnowledgeBase(newKB);
    localStorage.setItem('globalKnowledgeBase', JSON.stringify(newKB));

    const confirmMessage: Message = {
      id: Date.now().toString(),
      content: `Knowledge base updated successfully! ✅\nFile: "${newKB.filename}"`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([confirmMessage]);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setKnowledgeBase(null);
    setMessages([]);
    localStorage.removeItem('globalKnowledgeBase');
  }, []);

  // Send user message and get backend response
  const handleSendMessage = useCallback(async (content: string) => {
    if (!knowledgeBase) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // <-- CHANGED: Using Vite proxy /api/ask
      const res = await fetch(`/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: content, answerMode })
      });
      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer || "Sorry, no response from backend.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Error: Could not get response from backend.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error(err);
    }
  }, [knowledgeBase, answerMode]);

  const handleClearChat = useCallback(() => setMessages([]), []);

  const handleExportChat = useCallback(() => {
    const chatText = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.isUser ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header messages={messages} onClearChat={handleClearChat} onExportChat={handleExportChat} />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
        {user.role === 'admin' && (
          <AdminPanel
            onFileUpload={handleFileUpload}
            knowledgeBase={knowledgeBase}
            onRemoveFile={handleRemoveFile}
          />
        )}

        {user.role === 'user' && knowledgeBase && (
          <div className="bg-gray-100 border p-4 mb-6 rounded">
            <span className="text-green-600 font-medium">Knowledge Base Active:</span>
            <strong>{knowledgeBase.filename}</strong>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden">
          <ChatHistory messages={messages} />
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={!knowledgeBase}
            answerMode={answerMode}
            onAnswerModeChange={setAnswerMode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;