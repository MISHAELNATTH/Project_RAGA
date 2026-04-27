import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadArea from './components/UploadArea';
import ChatInterface from './pages/ChatInterface';

function App() {
  const [activeDocuments, setActiveDocuments] = useState([]);
  const [initialQuestion, setInitialQuestion] = useState('');
  const [currentScreen, setCurrentScreen] = useState('upload'); // 'upload' or 'chat'

  const handleUploadComplete = (fileName, question) => {
    if (fileName) {
      setActiveDocuments(prev => [...new Set([...prev, fileName])]);
    }
    if (question) {
      setInitialQuestion(question);
    }
    setCurrentScreen('chat');
  };

  const handleNewChat = () => {
    setCurrentScreen('upload');
    setInitialQuestion('');
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar onNewChat={handleNewChat} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Navigation / Header area for the main content */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-end px-6 shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentScreen === 'upload' ? (
            <UploadArea onUploadComplete={handleUploadComplete} />
          ) : (
            <ChatInterface 
              activeDocuments={activeDocuments} 
              initialQuestion={initialQuestion} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
