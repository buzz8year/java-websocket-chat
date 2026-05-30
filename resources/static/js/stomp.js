'use strict';

import * as Dom from './dom.js';

export var stompClient = null;
export var username = null;

var notificationsSubscription = null;
var membersSubscription = null;

var publicHistorySubscription = null;
var publicSubscription = null;

var privateHistorySubscription = null;
var privateSubscription = null;
var privateCurrent = null;


export function connect(event)
{
    username = document.querySelector('#input-username').value.trim();
    if (!username) return;

    Dom.chatWrapper.classList.remove('hidden');
    Dom.usernameForm.classList.add('hidden');

    let socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnectPublic, onError);
}


export function onConnectPublic()
{
    subscribePublic();
    stompClient.send('/app/chat.addUser', {}, JSON.stringify({sender: username, type: 'JOIN'}));
}


export function onConnectPrivate(to)
{
    subscribePrivate(to);
    stompClient.send('/app/chat.privateConnect', {}, JSON.stringify({sender: username, to: to}));
}


function subscribePublic()
{
    if (publicHistorySubscription) publicHistorySubscription.unsubscribe();
    if (publicSubscription) publicSubscription.unsubscribe();

    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (privateSubscription) privateSubscription.unsubscribe();
    if (privateCurrent) privateCurrent = null;

    if (!notificationsSubscription) notificationsSubscription = stompClient.subscribe('/user/' + username + '/notifications', onNoticeReceived);
    if (!membersSubscription) membersSubscription = stompClient.subscribe('/queue/members', onMembersReceived);

    publicHistorySubscription = stompClient.subscribe('/queue/history', onHistoryReceived);
    publicSubscription = stompClient.subscribe('/topic/public', onMessageReceived);
}


function subscribePrivate(to)
{
    if (publicHistorySubscription) publicHistorySubscription.unsubscribe();
    if (publicSubscription) publicSubscription.unsubscribe();

    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (privateSubscription) privateSubscription.unsubscribe();
    if (privateCurrent) privateCurrent = null;

    privateHistorySubscription = stompClient.subscribe('/user/' + username + '/privateHistory', onHistoryReceived);
    privateSubscription = stompClient.subscribe('/user/' + username + '/privateChat', onMessageReceivedPrivate);
    privateCurrent = to;
}


function onError(error)
{
    console.log(error);
}


function onHistoryReceived(payload)
{
    if (privateHistorySubscription) privateHistorySubscription.unsubscribe();
    if (publicHistorySubscription) publicHistorySubscription.unsubscribe();

    let messages = JSON.parse(payload.body);
    if (messages) messages.forEach(m => Dom.displayMessage(m));
}


function onMembersReceived(payload)
{
    let members = JSON.parse(payload.body);
    if (members) members.forEach(m => Dom.displayMember(m));
}


function onMessageReceived(payload)
{
    let message = JSON.parse(payload.body);

    if (message.type === 'LEAVE')
        document.querySelector('.user-container[member=' + message.sender + ']').remove();

    else if (message.type === 'CHAT')
        Dom.displayMessage(message);
}

function onMessageReceivedPrivate(payload)
{
    let message = JSON.parse(payload.body);
    if (message.sender === privateCurrent)
        Dom.displayMessage(message);
}


function onNoticeReceived(payload)
{
    let message = JSON.parse(payload.body);
    if (message.sender && message.to === username)
        Dom.updateCounter(message.sender)
}


function sendPrivateMessage(to)
{
    let message = {
        to: to,
        sender: username,
        content: Dom.getMessage(),
        type: 'CHAT'
    };
    stompClient.send('/app/chat.privateMessage', {}, JSON.stringify(message));
    Dom.displayMessage(message);
}


function sendPublicMessage()
{
    let chatMessage = {
        sender: username,
        content: Dom.getMessage(),
        type: 'CHAT'
    };
    stompClient.send('/app/chat.publicMessage', {}, JSON.stringify(chatMessage));
}


export function sendMessage()
{
    if (!Dom.getMessage() || !stompClient)
        return;

    if (privateCurrent && privateSubscription)
        sendPrivateMessage(privateCurrent);

    else sendPublicMessage();

    Dom.messageInput.value = '';
}
