package chat.controller;

import chat.model.Chat;
import chat.model.ChatMessage;
import chat.util.ChatMatcher;

import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;

import java.util.concurrent.CopyOnWriteArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;


@Controller
public class ChatController
{
    @Autowired
    private final SimpMessageSendingOperations messagingTemplate;
    private final Set<String> connectedUsers = new LinkedHashSet<>();

    private final List<Chat> privateChats = new CopyOnWriteArrayList<>();
    private final List<ChatMessage> publicMessages = new CopyOnWriteArrayList<>();


    public ChatController(SimpMessageSendingOperations messagingTemplate)
    {
        this.messagingTemplate = messagingTemplate;
    }


    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, StompHeaderAccessor headerAccessor)
    {
        // Add username to web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        connectedUsers.add(chatMessage.getSender());

        messagingTemplate.convertAndSend("/queue/members", connectedUsers);
        messagingTemplate.convertAndSend("/queue/history", publicMessages);
        return chatMessage;
    }


    @MessageMapping("/chat.publicMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage)
    {
        publicMessages.add(chatMessage);
        return chatMessage;
    }


    @MessageMapping("/chat.privateMessage")
    public void sendPrivateMessage(ChatMessage chatMessage)
    {
        ChatMatcher.addMessage(privateChats, chatMessage);
        messagingTemplate.convertAndSendToUser(chatMessage.getTo(), "/privateChat", chatMessage);
        messagingTemplate.convertAndSendToUser(chatMessage.getTo(), "/notifications", chatMessage);
    }


    @MessageMapping("/chat.privateConnect")
    public void privateChatConnect(ChatMessage chatMessage)
    {
        for (Chat chat : privateChats)
            if (ChatMatcher.matches(chat, chatMessage))
                messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/privateHistory", chat.getMessages());
    }

}