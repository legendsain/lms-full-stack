import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Footer from '../../components/student/Footer';

const TeamChat = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken, userData } = useContext(AppContext);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [connected, setConnected] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ---- FETCH CHAT HISTORY (REST) ----
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/chat/${teamId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                    setMessages(data.messages);
                    setTeam(data.team);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load chat history");
            }
            setLoading(false);
        };

        if (teamId) fetchHistory();
    }, [teamId, backendUrl]);

    // ---- SOCKET.IO CONNECTION ----
    useEffect(() => {
        if (!userData || !team) return;

        const socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            // Join the team room
            socket.emit('join-team', {
                teamId,
                userId: userData._id,
                userName: userData.name,
                userImage: userData.imageUrl,
            });
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        // Listen for new messages
        socket.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Online users
        socket.on('online-users', (users) => {
            setOnlineUsers(users);
        });

        // Typing indicators
        socket.on('user-typing', ({ userName }) => {
            setTypingUser(userName);
        });

        socket.on('user-stop-typing', () => {
            setTypingUser(null);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userData, team, backendUrl, teamId]);

    // ---- SEND MESSAGE ----
    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current || !userData) return;

        socketRef.current.emit('send-message', {
            teamId,
            userId: userData._id,
            userName: userData.name,
            userImage: userData.imageUrl,
            text: newMessage.trim(),
        });

        // Stop typing
        socketRef.current.emit('stop-typing', { teamId });
        setNewMessage('');
        inputRef.current?.focus();
    };

    // ---- TYPING INDICATOR ----
    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (!socketRef.current) return;

        socketRef.current.emit('typing', { teamId, userName: userData?.name });

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('stop-typing', { teamId });
        }, 1500);
    };

    // ---- FORMAT TIME ----
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const dateKey = formatDate(msg.createdAt);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-surface-200 border-t-brand-600 animate-spin"></div>
                    <p className="text-sm text-surface-400 font-medium">Loading Team Chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col">
            <div className="flex-grow section-container pt-6 pb-6 animate-fade-in">
                <div className="max-w-4xl mx-auto">

                    {/* ============ HEADER ============ */}
                    <div className="premium-card p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate(-1)} className="btn-ghost !p-2 !rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                                        {team?.groupName || 'Team Chat'}
                                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-surface-300'}`}></span>
                                    </h1>
                                    <p className="text-xs text-surface-400">{team?.batchTitle}</p>
                                </div>
                            </div>

                            {/* Online Users */}
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {onlineUsers.slice(0, 5).map((user, i) => (
                                        <img
                                            key={user.userId}
                                            src={user.userImage}
                                            alt={user.userName}
                                            title={user.userName}
                                            className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
                                        />
                                    ))}
                                    {onlineUsers.length > 5 && (
                                        <div className="w-7 h-7 rounded-full ring-2 ring-white bg-surface-200 flex items-center justify-center text-[10px] font-bold text-surface-600">
                                            +{onlineUsers.length - 5}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-surface-400 hidden sm:inline">
                                    {onlineUsers.length} online
                                </span>
                            </div>
                        </div>

                        {/* Team Members Bar */}
                        {team?.members && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100 overflow-x-auto">
                                {team.members.map((member) => {
                                    const isOnline = onlineUsers.some(u => u.userId === member.userId);
                                    return (
                                        <div key={member.userId} className="flex items-center gap-1.5 bg-surface-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                            <div className="relative">
                                                {member.studentImage ? (
                                                    <img src={member.studentImage} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-surface-200 flex items-center justify-center text-[9px] font-bold text-surface-500">
                                                        {member.studentName?.[0]}
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-surface-300'}`}></div>
                                            </div>
                                            <span className="text-[11px] font-medium text-surface-600">
                                                {member.userId === userData?._id ? 'You' : member.studentName?.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ============ MESSAGES AREA ============ */}
                    <div className="premium-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
                        {/* Message List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {messages.length === 0 && (
                                <div className="flex items-center justify-center h-full text-center">
                                    <div>
                                        <div className="text-4xl mb-3">💬</div>
                                        <h3 className="text-lg font-bold text-surface-700">Start the conversation</h3>
                                        <p className="text-surface-400 text-sm mt-1">Be the first to say hello to your team!</p>
                                    </div>
                                </div>
                            )}

                            {Object.entries(groupedMessages).map(([date, msgs]) => (
                                <div key={date}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-surface-200"></div>
                                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{date}</span>
                                        <div className="flex-1 h-px bg-surface-200"></div>
                                    </div>

                                    {msgs.map((msg, i) => {
                                        const isMe = msg.senderId === userData?._id;
                                        const showAvatar = i === 0 || msgs[i - 1]?.senderId !== msg.senderId;

                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                                            >
                                                {/* Avatar */}
                                                <div className="w-8 flex-shrink-0">
                                                    {showAvatar && !isMe && (
                                                        <img
                                                            src={msg.senderImage}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full ring-2 ring-surface-100 object-cover"
                                                        />
                                                    )}
                                                </div>

                                                {/* Bubble */}
                                                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {showAvatar && !isMe && (
                                                        <p className="text-[11px] font-semibold text-surface-500 mb-1 ml-1">{msg.senderName}</p>
                                                    )}
                                                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                                                        isMe
                                                            ? 'bg-brand-600 text-white rounded-br-md'
                                                            : 'bg-surface-100 text-surface-800 rounded-bl-md'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                    <p className={`text-[10px] text-surface-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {typingUser && typingUser !== userData?.name && (
                                <div className="flex items-center gap-2 ml-10 mt-2 animate-fade-in">
                                    <div className="bg-surface-100 px-3 py-2 rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-surface-400">{typingUser} is typing...</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ============ INPUT BAR ============ */}
                        <div className="border-t border-surface-200 p-3 bg-white">
                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                                    maxLength={2000}
                                    disabled={!connected}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || !connected}
                                    className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                    </svg>
                                </button>
                            </form>
                            {!connected && (
                                <p className="text-[10px] text-red-500 mt-1 ml-1">⚠️ Disconnected — reconnecting...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TeamChat;
