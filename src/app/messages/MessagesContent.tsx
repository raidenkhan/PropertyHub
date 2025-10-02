// app/messages/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, AlertTriangle, Send, Check, CheckCheck } from "lucide-react";
//import { ProtectedRoute } from "@/lib/auth/protectedRoute";
import { useAuth } from "@/lib/auth/authContext";
import { chatService } from "@/lib/api/chatService";
import { messagesService } from "@/lib/api/messageService";
import { toast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/animated-background";

interface Message {
  id: number;
  content: string;
  sender: { id: number; name: string };
  receiver: { id: number; name: string };
  isRead: boolean;
  isReported: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'seen';
}

interface User {
  id: number;
  name: string;
}

const useSound = (src: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    setAudio(audio);
  }, [src]);

  return () => {
    audio?.play();
  };
};

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostId = searchParams.get('hostId');
  const propertyId = searchParams.get('propertyId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); //  Real users
  const [isManager, setIsManager] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const playSentSound = useSound('/sent-message.mp3');

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch conversations on mount

// app/messages/page.tsx
useEffect(() => {
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // 👇 Always fetch conversations (even without hostId)
      const conversations = await messagesService.getConversations();
      setUsers(conversations || []);
      console.log("From messages")
      // 👇 Only auto-select if hostId exists
      if (hostId) {
        const host = conversations.find(u => u.id === parseInt(hostId));
        if (host) {
          setSelectedUser(host);
          const msgs = await messagesService.getMessagesWithUser(host.id);
          setMessages(msgs || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast({
        title: "❌ Load Failed",
        description: "Could not load your conversations.",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchConversations();
}, [hostId]); // Keep hostId as dependency

  // Setup WebSocket
  useEffect(() => {
    if (!user) return;

    const socket = chatService.connect();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // Only add message if it's part of the selected conversation
      if (selectedUser && (message.sender.id === selectedUser.id || message.receiver.id === selectedUser.id)) {
        setMessages(prev => [...prev, message]);
      }
      if (message.isReported) {
        toast({
          title: "⚠️ Reported Message",
          description: `Message from ${message.sender.name} was reported.`,
          variant: "destructive",
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('error'));

    if (user?.roles?.some(r => ['PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
      setIsManager(true);
      chatService.joinManagerRoom();
    }

    return () => {
      socket.off('newMessage', handleNewMessage);
      chatService.disconnect(); // Disconnect on final cleanup
    };
  }, [user, selectedUser]);

  // Fetch messages when user selected
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const msgs = await messagesService.getMessagesWithUser(selectedUser.id) || [];
          setMessages(msgs);
          
          // Mark messages as read when user opens the conversation
          await messagesService.markAsRead(selectedUser.id);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      };
      fetchMessages();
    }
  }, [selectedUser]);
// In UI (for debugging)
<div className="text-xs text-muted-foreground mb-2">
  Socket Status: {socketStatus}
</div>
  const handleSendMessage = () => {
    if (!input.trim() || !selectedUser) return;

    // Optimistic UI update
    const newMessage: Message = {
      id: Date.now(),
      content: input,
      sender: { id: user?.id || 0, name: user?.name || 'You' },
      receiver: selectedUser,
      isRead: false,
      isReported: false,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    playSentSound();

    // Send via WebSocket
    chatService.sendMessage(selectedUser.id, input);
  };

  const handleReportMessage = async (messageId: number) => {
    try {
      await messagesService.reportMessage(messageId);
      toast({
        title: "✅ Message Reported",
        description: "Our moderation team will review this message.",
      });
      
      // Optimistic UI update
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isReported: true } : msg
        )
      );
    } catch (error) {
      toast({
        title: "❌ Report Failed",
        description: "Could not report message. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    //<ProtectedRoute>
    
      <div className="min-h-screen bg-background dark:bg-gray-900 relative">
        <AnimatedBackground />
        <Header />

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Messages</h2>
                <div className="space-y-3">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-primary/10 dark:bg-primary/20 border border-primary"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm lg:col-span-2">
              <CardContent className="p-6 h-96 flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold">{selectedUser.name}</h3>
                        {propertyId && (
                          <p className="text-sm text-muted-foreground">
                            Chat about Property ID: {propertyId}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Active now</p>
                      </div>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {messages
                        .filter(m => m.sender.id === selectedUser.id || m.receiver.id === selectedUser.id)
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg ${
                                message.sender.id === user?.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700"
                              } ${message.isReported ? 'border-2 border-red-500' : ''}`}
                            >
                              <p>{message.content}</p>
                              <div className="flex items-center justify-end text-xs mt-1 opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString()}
                                {message.sender.id === user?.id && (
                                  <span className="ml-2">
                                    {message.status === 'sent' && <Check className="w-4 h-4" />}
                                    {message.status === 'delivered' && <CheckCheck className="w-4 h-4" />}
                                    {message.status === 'seen' && <CheckCheck className="w-4 h-4 text-blue-500" />}
                                  </span>
                                )}
                                {message.isReported && (
                                  <span className="ml-2 text-red-500">⚠️ Reported</span>
                                )}
                              </div>
                              {message.sender.id !== user?.id && !message.isReported && (
                                <button
                                  onClick={() => handleReportMessage(message.id)}
                                  className="text-xs text-red-500 hover:underline mt-1"
                                >
                                  Report
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <p>Select a user to start chatting</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Manager Monitoring Panel */}
          {isManager && (
            <Card className="border-0 shadow-xl bg-red-50 dark:bg-red-900/20 backdrop-blur-sm mt-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Manager Monitoring Panel</h3>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  You are monitoring all reported messages. Take action if needed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    //</ProtectedRoute>
    
  );
}