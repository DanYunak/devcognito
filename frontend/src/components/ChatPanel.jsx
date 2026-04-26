import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, getSocket } from '../services/socket';

export default function ChatPanel({ applicationId }) {
  const { token, user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const socket = connectSocket(token);
    socketRef.current = socket;

    const onConnected = () => {
      socket.emit('chat:join', { applicationId });
    };

    const onHistory = ({ messages: hist }) => {
      setMessages(hist);
      setStatus('ready');
      setTimeout(scrollToBottom, 50);
    };

    const onMessage = ({ message }) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 50);
    };

    const onError = ({ message }) => {
      setStatus('error');
      setErrorMsg(message);
    };

    socket.on('chat:connected', onConnected);
    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);
    socket.on('chat:error', onError);

    // If already connected, join immediately
    if (socket.connected) {
      socket.emit('chat:join', { applicationId });
    }

    return () => {
      socket.off('chat:connected', onConnected);
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
      socket.off('chat:error', onError);
    };
  }, [applicationId, token, scrollToBottom]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || status !== 'ready') return;
    socketRef.current?.emit('chat:message', { applicationId, text: trimmed });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        ⚠️ {errorMsg || 'Chat unavailable for this application.'}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">💬 Chat</span>
        {status === 'connecting' && (
          <span className="text-xs text-slate-400">Connecting…</span>
        )}
        {status === 'ready' && (
          <span className="text-xs text-green-600">● Live</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
        {status === 'connecting' && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
          </div>
        )}
        {status === 'ready' && messages.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-4">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = String(msg.sender_id?._id || msg.sender_id) === String(user?.id);
          return (
            <div
              key={msg._id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-semibold mb-0.5 opacity-70 capitalize">
                    {msg.sender_id?.role || 'User'}
                  </p>
                )}
                <p className="break-words">{msg.text}</p>
                <p
                  className={`text-xs mt-1 text-right ${
                    isMine ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={status !== 'ready'}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={status !== 'ready' || !text.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-lg text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}