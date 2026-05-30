package chat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

import chat.model.ChatMessage;
import java.util.Map;

@Component
public class WebSocketEventListener
{
    @Autowired
    private final SimpMessageSendingOperations messagingTemplate;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate)
    {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void connect(SessionConnectedEvent event) {}

    @EventListener
    public void disconnect(SessionDisconnectEvent event)
    {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> attributes = headerAccessor.getSessionAttributes();
        if (attributes == null)
            return;

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null)
            return;

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setType(ChatMessage.MessageType.LEAVE);
        chatMessage.setSender(username);

        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}
