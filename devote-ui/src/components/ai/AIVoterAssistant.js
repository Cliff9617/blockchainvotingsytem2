import React, { useState, useRef, useEffect } from 'react';
import { getResponse, getSuggestedQuestionsByCategory } from './voterAssistantKnowledge';
import './AIVoterAssistant.css';

/**
 * DeVote AI Voter Assistant
 * 
 * A floating chatbot widget that helps voters understand the voting system.
 * Uses a rule-based knowledge base for responses.
 * 
 * Features:
 * - DeVote system help
 * - Kenyan civic education
 * - Election awareness
 * - Blockchain voting education
 * - Categorized quick actions
 * - Expandable chat window
 * - Neutral and non-partisan responses
 * 
 * Props:
 * - isWalletConnected: boolean - Whether user has connected their wallet
 * - isAdmin: boolean - Whether user is an admin
 * - electionStarted: boolean - Whether election has started
 * - electionEnded: boolean - Whether election has ended
 * - hasVoted: boolean - Whether user has already voted
 * - isEligible: boolean - Whether user is eligible to vote
 */
const AIVoterAssistant = ({
  isWalletConnected = false,
  isAdmin = false,
  electionStarted = false,
  electionEnded = false,
  hasVoted = false,
  isEligible = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm the DeVote AI Assistant. I'm here to help you with voting, registration, MetaMask, eligibility, and any questions about our blockchain voting system. I can also explain Kenyan civic education topics like IEBC, democratic rights, and the election process. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get current app state for contextual responses
  const appState = {
    isWalletConnected,
    isAdmin,
    electionStarted,
    electionEnded,
    hasVoted,
    isEligible
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handle sending a message
  const handleSend = (text) => {
    const userMessage = text || inputValue.trim();
    if (!userMessage) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking delay
    setTimeout(() => {
      const response = getResponse(userMessage, appState);
      
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 400); // Random delay between 800-1200ms
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question) => {
    handleSend(question);
  };

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get suggested questions by category
  const suggestedQuestionsByCategory = getSuggestedQuestionsByCategory(appState);

  // Get flat list for display
  const getAllQuestions = () => {
    return Object.values(suggestedQuestionsByCategory).flat();
  };

  // Filter questions by active category
  const getFilteredQuestions = () => {
    if (activeCategory === 'All') {
      return getAllQuestions();
    }
    return suggestedQuestionsByCategory[activeCategory] || [];
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        text: "Chat cleared! I'm ready to help you with any questions about DeVote, voting, or Kenyan civic education.",
        timestamp: new Date()
      }
    ]);
  };

  // Toggle expand mode
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Close overlay when clicked
  const handleOverlayClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsOpen(false);
    }
  };

  // Get category names
  const categoryNames = ['All', ...Object.keys(suggestedQuestionsByCategory)];

  return (
    <div className="ai-assistant-container">
      {/* Overlay for expanded mode */}
      {isOpen && isExpanded && (
        <div className="ai-overlay" onClick={handleOverlayClick} aria-hidden="true"></div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`ai-chat-window ${isExpanded ? 'expanded' : ''}`}>
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-content">
              <div className="ai-chat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="ai-chat-title">
                <h3>DeVote AI Assistant</h3>
                <p>DeVote help, civic education & election awareness</p>
              </div>
            </div>
            <div className="ai-header-actions">
              <button 
                className="ai-expand-button"
                onClick={toggleExpand}
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 14 10 14 10 20"></polyline>
                    <polyline points="20 10 14 10 14 4"></polyline>
                    <line x1="14" y1="10" x2="21" y2="3"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                )}
              </button>
              <button 
                className="ai-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="ai-messages-container">
            <div className="ai-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`ai-message ${message.type}`}
                >
                  <div className="ai-message-avatar">
                    {message.type === 'bot' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"></path>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <path d="M9 16c.5 1 2 1 2.5 1s2 0 2.5-1"></path>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-message-text">
                      {message.text.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="ai-message-time">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="ai-message bot">
                  <div className="ai-message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"></path>
                      <circle cx="9" cy="12" r="1"></circle>
                      <circle cx="15" cy="12" r="1"></circle>
                      <path d="M9 16c.5 1 2 1 2.5 1s2 0 2.5-1"></path>
                    </svg>
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested Questions with Categories */}
          <div className="ai-suggestions">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p className="ai-suggestions-label" style={{ margin: 0 }}>Quick questions:</p>
              <button 
                className="ai-clear-chat-btn"
                onClick={handleClearChat}
                aria-label="Clear chat history"
              >
                Clear chat
              </button>
            </div>

            {/* Category Tabs */}
            <div className="ai-category-toggle">
              {categoryNames.map((category) => (
                <button
                  key={category}
                  className={`ai-category-tab ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                  aria-label={`Show ${category} questions`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Questions for active category */}
            <div className="ai-suggestions-list">
              {getFilteredQuestions().map((question, index) => (
                <button
                  key={index}
                  className="ai-suggestion-btn"
                  onClick={() => handleSuggestedQuestion(question)}
                  aria-label={question}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form className="ai-input-container" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ai-input"
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              aria-label="Type your question"
            />
            <button 
              type="submit" 
              className="ai-send-button"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        className={`ai-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close assistant' : 'Open AI assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="ai-toggle-label">AI Help</span>
          </>
        )}
      </button>
    </div>
  );
};

export default AIVoterAssistant;