package chat.util;

import chat.model.Chat;
import chat.model.ChatMessage;

import java.util.List;
import java.util.Objects;

public class ChatMatcher
{
    public static boolean matches(Chat chat, ChatMessage chatMessage)
    {
        boolean matchesUserA = Objects.equals(chat.getUserA(), chatMessage.getSender())
                || Objects.equals(chat.getUserA(), chatMessage.getTo());

        boolean matchesUserB = Objects.equals(chat.getUserB(), chatMessage.getSender())
                || Objects.equals(chat.getUserB(), chatMessage.getTo());

        return matchesUserA && matchesUserB;
    }

    public static void addMessage(List<Chat> chats, ChatMessage chatMessage)
    {
        boolean done = false;

        for (Chat chat : chats)
        {
            if (ChatMatcher.matches(chat, chatMessage))
            {
                chat.addMessage(chatMessage);
                done = true;
            }
        }

        if (chats.isEmpty() || !done)
            chats.add(new Chat(chatMessage));
    }
}
