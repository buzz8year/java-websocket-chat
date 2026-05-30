'use strict';

const chatWrapper = document.getElementById('chat-wrapper');
const messagesWrapper = document.getElementById('messages');
const usersWrapper = document.getElementById('users');

const messageInput = document.getElementById('input-msg');
const messageButton = document.getElementById('send-msg-btn');
const publicButton = document.getElementById('public-chat-btn');
const loginButton = document.getElementById('send-username-btn');

const usernameForm = document.getElementById('username-input-wrapper');
const messageForm = document.getElementById('message-input-wrapper');
const chatTitle = document.getElementById('chat-with');

var username = null;
var stompClient = null;

var membersSubscription = null;
var historySubscription = null;
var publicSubscription = null;

var privateHistorySubscription = null;
var privateSubscription = null;
var privateUser = null;


function subscribePublic()
{
    if (historySubscription) historySubscription.unsubscribe();
    if (publicSubscription) publicSubscription.unsubscribe();

    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (privateSubscription) privateSubscription.unsubscribe();
    if (privateUser) privateUser = null;

    if (!membersSubscription) membersSubscription = stompClient.subscribe('/queue/members', onMembersReceived);
    historySubscription = stompClient.subscribe('/queue/newMember', onHistoryReceived);
    publicSubscription = stompClient.subscribe('/topic/public', onMessageReceived);
}


function subscribePrivate(to)
{
    if (historySubscription) historySubscription.unsubscribe();
    if (publicSubscription) publicSubscription.unsubscribe();

    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (privateSubscription) privateSubscription.unsubscribe();
    if (privateUser) privateUser = null;

    privateHistorySubscription = stompClient.subscribe('/user/' + username + '/privateHistory', onHistoryReceived);
    privateSubscription = stompClient.subscribe('/user/' + username + '/privateChat', onMessageReceivedPrivate);
    privateUser = to;
}


function connect(event)
{
    username = document.querySelector('#input-username').value.trim();
    if (!username) return;

    usernameForm.classList.add('hidden');
    chatWrapper.classList.remove('hidden');

    let socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnectPublic, onError);
}


function onConnectPublic()
{
    subscribePublic();
    stompClient.send('/app/chat.addUser', {}, JSON.stringify({sender: username, type: 'JOIN'}));
}


function onConnectPrivate(to)
{
    subscribePrivate(to);
    stompClient.send('/app/chat.privateConnect', {}, JSON.stringify({sender: username, to: to}));
}


function onError(error) {}


function onHistoryReceived(payload)
{
    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (historySubscription) historySubscription.unsubscribe();

    let messages = JSON.parse(payload.body);
    if (messages) messages.forEach(m => displayMessage(m));
}


function onMessageReceived(payload)
{
    let message = JSON.parse(payload.body);

    if (message.type === 'LEAVE')
        document.querySelector('.user[member=' + message.sender + ']').remove();

    else if (message.type === 'CHAT')
        displayMessage(message);
}

function onMessageReceivedPrivate(payload)
{
    let message = JSON.parse(payload.body);

    if (message.sender === privateUser)
        displayMessage(message);
}


function onMembersReceived(payload)
{
    document.querySelectorAll('.user').forEach(el => el.remove());

    let members = JSON.parse(payload.body);
    if (members) members.forEach(m => displayMember(m));
}


function selectElement(el)
{
    document.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
}


function getMessage()
{
    return messageInput.value.trim();
}


function sendMessage()
{
    if (!getMessage() || !stompClient)
        return;

    if (privateUser && privateSubscription)
        sendPrivateMessage(privateUser);

    else sendPublicMessage();

    messageInput.value = '';
}


function sendPrivateMessage(to)
{
    let message = {
        to: to,
        sender: username,
        content: getMessage(),
        type: 'CHAT'
    };
    stompClient.send('/app/chat.privateMessage', {}, JSON.stringify(message));
    displayMessage(message);
}


function sendPublicMessage()
{
    let chatMessage = {
        sender: username,
        content: getMessage(),
        type: 'CHAT'
    };
    stompClient.send('/app/chat.publicMessage', {}, JSON.stringify(chatMessage));
}


function clearMessages()
{
    document.querySelectorAll('.message-container').forEach(m => m.remove());
}


function displayMessage(message)
{
    if (!message) return;

    const messageDiv = document.createElement('div');
    const messageSpan = document.createElement('span');
    const senderSpan = document.createElement('span');
    const dateSpan = document.createElement('span');

    senderSpan.textContent = message.sender;
    senderSpan.classList.add('sender');

    const timestamp = new Date().toISOString().slice(11, 19);
    dateSpan.textContent = timestamp;
    dateSpan.classList.add('date');

    messageSpan.textContent = message.content;
    messageSpan.classList.add('message');

    messageDiv.classList.add('message-container');
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(messageSpan);
    messageDiv.appendChild(dateSpan);

    messagesWrapper.appendChild(messageDiv);
    messageDiv.scrollIntoView({'behavior': 'smooth'});

    messageInput.value = '';
}


function displayMember(member)
{
    if (member === username) return;

    let el = document.createElement('div');
    el.classList.add('user');

    el.setAttribute('member', member);
    el.textContent = member;

    if (member === privateUser) el.classList.add('selected');
    usersWrapper.appendChild(el);

    el.addEventListener('click', (event) => {
        chatTitle.textContent = member;
        selectElement(el);
        clearMessages();
        onConnectPrivate(member);
    });
}


publicButton.addEventListener('click', (event) => {
    chatTitle.textContent = 'Public chat';
    selectElement(publicButton);
    clearMessages();
    onConnectPublic();
});


loginButton.addEventListener('click', connect, true);
messageButton.addEventListener('click', sendMessage, true);
messageInput.addEventListener('keydown', (event) => event.key === 'Enter' && sendMessage());