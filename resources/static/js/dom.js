'use strict';

import * as Stomp from './stomp.js';

export const usernameForm = document.getElementById('username-input-wrapper');
export const messageForm = document.getElementById('message-input-wrapper');
export const messagesWrapper = document.getElementById('messages');
export const chatWrapper = document.getElementById('chat-wrapper');
export const usersWrapper = document.getElementById('users');
export const messageButton = document.getElementById('send-msg-btn');
export const messageInput = document.getElementById('input-msg');

const loginInput = document.querySelector('#input-username');
const loginButton = document.getElementById('send-username-btn');
const publicButton = document.getElementById('public-chat-btn');
const chatTitle = document.getElementById('chat-with');


memberButtonListener(publicButton);
messageButtonListener();
loginButtonListener();


export function getMessage()
{
    return messageInput.value.trim();
}


export function clearMessages()
{
    document.querySelectorAll('.message-container').forEach(m => m.remove());
}


export function updateCounter(sender)
{
    let users = document.querySelector('#users');
    let user = users.querySelector('.user-container[member=' + sender + ']');
    users.prepend(user);

    if (user.classList.contains('selected'))
        return;

    let counter = user.querySelector('.new-message-counter');
    let amount = parseInt(counter.textContent) + 1;

    counter.textContent = amount;
    counter.classList.remove('hidden');
}


export function displayMessage(message)
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

    // NOTE: Move chat tab to the top
    let users = document.querySelector('#users');
    let user = users.querySelector('.user-container[member=' + message.to + ']');
    if (user) users.prepend(user);
}


export function displayMember(member)
{
    if (member === Stomp.username) return;

    let exists = document.querySelector('.user-container[member=' + member + ']');
    if (exists) return;

    let div = document.createElement('div');
    div.classList.add('user-container');
    div.setAttribute('member', member);

    let span = document.createElement('span');
    span.classList.add('user');
    span.textContent = member;

    let counter = document.createElement('span');
    counter.classList.add('new-message-counter');
    counter.classList.add('hidden');
    counter.textContent = 0;

    div.appendChild(span);
    div.appendChild(counter);

    memberButtonListener(div, member);
    usersWrapper.appendChild(div);
}


function selectMember(el)
{
    document.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');

    // NOTE: Reset and hide counter
    if (!el.classList.contains('user-container')) return;
    let counter = el.querySelector('.new-message-counter');
    counter.classList.add('hidden');
    counter.textContent = 0;
}


function memberButtonListener(el, member)
{
    el.addEventListener('click', (event) => {

        chatTitle.textContent = member ? member : 'Public chat';
        selectMember(el);
        clearMessages();

        if (member) Stomp.onConnectPrivate(member);
        else Stomp.onConnectPublic();
    });
}


function messageButtonListener()
{
    messageButton.addEventListener('click', Stomp.sendMessage, true);
    messageInput.addEventListener('keydown', event => event.key === 'Enter' && Stomp.sendMessage());
}


function loginButtonListener()
{
    loginButton.addEventListener('click', Stomp.connect, true);
    loginInput.addEventListener('keydown', event => event.key === 'Enter' && Stomp.connect());
}
