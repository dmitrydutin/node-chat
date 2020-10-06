const socket = io.connect()
const main = document.querySelector('.main')
let scrollHeight = 0
let messagesQuantity = 0
let messageEditId = -1

setHeight()

socket.on('connected', (userId) => {
    if (!sessionStorage.getItem('userId')) {
        sessionStorage.setItem('userId', userId)
        sessionStorage.setItem('name', 'Anonymous')
    }
    document.querySelector('.user-name').innerText = sessionStorage.getItem('name')
    socket.emit('load history', sessionStorage.getItem('userId'), messagesQuantity)
})

socket.on('history', (messages) => {
    for (let message of messages) {
        addMessage(message, 'history')
    }
})

socket.on('get message', addMessage)

messageForm.onsubmit = (event) => {
    event.preventDefault()

    const messageText = messageForm.message.value
    if (messageText === '') return;

    const userId = sessionStorage.getItem('userId')
    const name = sessionStorage.getItem('name')

    if (messageEditId == -1) {
        socket.emit('send message', userId, name, messageText)
    } else {
        socket.emit('edit message', messageText, messageEditId)
        messageEditId = -1
    }

    messageForm.message.value = ''
}

function addMessage(message, flag = '') {
    const messageBlock = document.createElement('div')
    messageBlock.className = message.isAuthor ? 'message' : 'message message-left'
    messageBlock.dataset.id = message.id

    const messageInner = document.createElement('div')
    messageInner.className = 'message__inner'

    if (!message.isAuthor) {
        const messageAuthor = document.createElement('h2')
        messageAuthor.className = 'message__author'
        messageAuthor.innerHTML = message.username
        messageInner.append(messageAuthor)
    }

    const messageText = document.createElement('div')
    messageText.className = 'message__text'
    messageText.innerHTML = message.text
    messageInner.append(messageText)

    const messageTools = document.createElement('div')
    messageTools.className = 'message__tools'

    const messageEdit = document.createElement('div')
    messageEdit.className = 'message__edit'
    messageTools.append(messageEdit)

    const messageDelete = document.createElement('div')
    messageDelete.className = 'message__delete'
    messageTools.append(messageDelete)

    messageBlock.append(messageInner)
    messageBlock.append(messageTools)

    if (flag === '') {
        main.append(messageBlock)
        main.scrollTop = main.scrollHeight
    } else {
        main.prepend(messageBlock)
        main.scrollTop = main.scrollHeight - scrollHeight
    }

    messageEdit.addEventListener('click', editMessage)
    messageDelete.addEventListener('click', deleteMessage)
}

function editMessage(event) {
    const id = event.path[2].dataset.id
    const text = event.path[2].childNodes[0].lastChild.innerText

    messageForm.message.value = text
    messageEditId = id
    messageForm.message.focus()
}

socket.on('update message', (text, id) => {
    document.querySelector(`[data-id='${id}']`).childNodes[0].lastChild.innerHTML = text
})

function deleteMessage(event) {
    const id = event.path[2].dataset.id
    socket.emit('delete message', id)
}

socket.on('deleted message', id => {
    document.querySelector(`[data-id='${id}']`).remove()
    messagesQuantity--
})

document.querySelector('.user-name-edit').addEventListener('click', () => {
    let name = prompt('Enter username', sessionStorage.getItem('name'))

    if (name) {
        socket.emit('new username', sessionStorage.getItem('userId'), name)
        sessionStorage.setItem('name', name)
        document.querySelector('.user-name').innerText = name
    }
})

socket.on('update username', (name, messagesId) => {
    for (let messageId of messagesId) {
        const message = document.querySelector(`[data-id="${messageId.id}"]`)
        const messageInner = message.childNodes[0]

        if (messageInner.childNodes.length === 2) {
            messageInner.childNodes[0].innerText = name
        }
    }
})

main.addEventListener('scroll', () => {
    if (main.scrollTop === 0) {
        scrollHeight = main.scrollHeight
        messagesQuantity += 20
        socket.emit('load history', sessionStorage.getItem('userId'), messagesQuantity)
    }
})

window.addEventListener('resize', setHeight)

function setHeight() {
    let vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    main.scrollTop = main.scrollHeight
}

;['dragenter', 'dragexit', 'dragover', 'drop'].forEach(eventName => {
    main.addEventListener(eventName, preventDefaults, false)
})

function preventDefaults(e) {
    e.stopPropagation()
    e.preventDefault()
}

main.addEventListener('drop', handleDrop, false)

function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files
    handleFiles(files)
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile)
}

async function uploadFile(file) {
    if (file.type !== 'image/jpeg') {
        alert('Select image!')
    } else {
        const url = 'https://api.cloudinary.com/v1_1/hajyom5vd/image/upload'
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'chatitransition')

        const res = await fetch(
            'https://api.cloudinary.com/v1_1/hajyom5vd/image/upload',
            {
                method: 'POST',
                body: formData
            }
        )
        const result = await res.json()

        const userId = sessionStorage.getItem('userId')
        const name = sessionStorage.getItem('name')

        socket.emit('send message', userId, name, result.secure_url)
    }
}