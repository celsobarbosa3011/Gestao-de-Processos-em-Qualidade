import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatConversation, sendChatMessage, getUnreadCount, getAllProfiles, getUserConversations, type ChatConversationSummary } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, X, Users, ArrowLeft, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile, ChatMessage } from "@shared/schema";

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const { currentUser } = useStore();

  const { data: unreadData } = useQuery({
    queryKey: ["chat-unread"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    enabled: !!currentUser,
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          data-testid="button-chat"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {selectedUser ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {selectedUser.name}
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                Chat Interno
              </>
            )}
          </SheetTitle>
        </SheetHeader>
        
        {selectedUser ? (
          <ChatConversation 
            otherUser={selectedUser} 
            onClose={() => setSelectedUser(null)}
          />
        ) : (
          <UserList onSelectUser={setSelectedUser} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "HH:mm", { locale: ptBR });
  } else if (isYesterday(date)) {
    return "Ontem";
  } else {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  }
}

function UserList({ onSelectUser }: { onSelectUser: (user: Profile) => void }) {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<"conversations" | "users">("conversations");
  
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: getUserConversations,
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: getAllProfiles,
  });

  const otherUsers = users.filter(u => u.id !== currentUser?.id && u.status === 'active');

  const handleSelectConversation = (conv: ChatConversationSummary) => {
    const user = users.find(u => u.id === conv.otherUserId);
    if (user) {
      onSelectUser(user);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "conversations" | "users")} className="flex-1 flex flex-col">
      <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
        <TabsTrigger value="conversations" data-testid="tab-conversations">Conversas</TabsTrigger>
        <TabsTrigger value="users" data-testid="tab-users">Usuários</TabsTrigger>
      </TabsList>
      
      <TabsContent value="conversations" className="flex-1 m-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma conversa ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vá para "Usuários" para iniciar uma conversa
                </p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.otherUserId}
                  onClick={() => handleSelectConversation(conv)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  data-testid={`chat-conversation-${conv.otherUserId}`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conv.otherUserName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{conv.otherUserName}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatConversationDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.otherUserUnit}</p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      <span className="font-medium">
                        {conv.lastMessageSenderId === currentUser?.id ? "Você" : conv.lastMessageSenderName.split(' ')[0]}:
                      </span>{" "}
                      {conv.lastMessage.slice(0, 50)}{conv.lastMessage.length > 50 ? "..." : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="users" className="flex-1 m-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {otherUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário disponível
              </p>
            ) : (
              otherUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  data-testid={`chat-user-${user.id}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.unit}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted"
                  )}>
                    {user.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

function formatMessageDate(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Hoje às ${format(date, "HH:mm", { locale: ptBR })}`;
  } else if (isYesterday(date)) {
    return `Ontem às ${format(date, "HH:mm", { locale: ptBR })}`;
  } else {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }
}

function ChatConversation({ otherUser, onClose }: { otherUser: Profile; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const { currentUser } = useStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-conversation", otherUser.id],
    queryFn: () => getChatConversation(otherUser.id),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(otherUser.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversation", otherUser.id] });
      queryClient.invalidateQueries({ queryKey: ["chat-unread"] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setMessage("");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhuma mensagem ainda.
              <br />
              Comece a conversa!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const senderName = isMe ? "Você" : otherUser.name;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isMe ? "justify-end" : "justify-start"
                  )}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className={cn(
                      "text-xs font-semibold mb-1",
                      isMe ? "text-primary-foreground/90" : "text-foreground/80"
                    )}>
                      {senderName}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatMessageDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sendMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
