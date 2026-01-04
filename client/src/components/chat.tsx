import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatConversation, sendChatMessage, getUnreadCount, getAllProfiles } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, X, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
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

function UserList({ onSelectUser }: { onSelectUser: (user: Profile) => void }) {
  const { currentUser } = useStore();
  
  const { data: users = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: getAllProfiles,
  });

  const otherUsers = users.filter(u => u.id !== currentUser?.id && u.status === 'active');

  return (
    <ScrollArea className="flex-1">
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
  );
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
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
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
