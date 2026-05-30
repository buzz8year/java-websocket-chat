package chat.model;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class Chat
{
    private final List<ChatMessage> messages = new CopyOnWriteArrayList<>();
    private String userA;
    private String userB;

    public Chat() {}

    public Chat(ChatMessage chatMessage)
    {
        this.messages.add(chatMessage);
        this.userA = chatMessage.getSender();
        this.userB = chatMessage.getTo();
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage chatMessage)
    {
        messages.add(chatMessage);
    }

    public String getUserA() {
        return userA;
    }

    public void setUserA(String userA) {
        this.userA = userA;
    }

    public String getUserB() {
        return userB;
    }

    public void setUserB(String userB) {
        this.userB = userB;
    }
}
