const path = require('path')
const randomstring = require('randomstring')
const pool = require(path.join(__dirname, 'db', 'index'))
const markdown = require( "markdown" ).markdown
const emoji = require(path.join(__dirname, 'emoji'))

module.exports = (io) => {
    io.on('connection', socket => {
        socket.emit('connected', randomstring.generate())
        socket.join('all')
    
        socket.on('load history', (userId, n) => {
            pool.getConnection((err, connection) => {
                if (err) return console.error(err)
    
                const takeMessages = 'SELECT * FROM messages ORDER BY id DESC LIMIT ?, 20'
    
                connection.execute(takeMessages, [n], (err, rows) => {
                    if (err) return console.error(err)
    
                    rows.forEach(item => {
                        item.isAuthor = item.userId === userId
                        delete item.userId

                        if (item.text.includes('https://res.cloudinary.com/hajyom5vd/image/upload/')) {
                            item.text = `<img src="${item.text}" alt="nature">`
                        } else {
                            item.text = markdown.toHTML(item.text)
                            emoji.forEach((eitem) => {
                                item.text = item.text.replace(eitem.key, eitem.emoji)
                            })
                        }
                    })
        
                    socket.emit('history', rows)
                })
                connection.release()
            })
        })

        socket.on('send message', (userId, username, messageText) => {
            pool.getConnection((err, connection) => {
                if (err) return console.error(err)
    
                const createMessage = 'INSERT INTO messages (userId, username, text) VALUES (?,?,?)'
    
                connection.execute(createMessage, [userId, username, messageText], (err, id) => {
                    if (err) return console.error(err)

                    emoji.forEach((eitem) => {
                        messageText = messageText.replace(eitem.key, eitem.emoji)
                    })

                    if (messageText.includes('https://res.cloudinary.com/hajyom5vd/image/upload/')) {
                        messageText = `<img src="${messageText}" alt="nature">`
                    } else {
                        messageText = markdown.toHTML(messageText)
                    }
    
                    socket.emit('get message', {id: id.insertId, username: username, text: messageText, isAuthor: true})
                    socket.to('all').emit('get message', {id: id.insertId, username: username, text: messageText, isAuthor: false})
                })
                connection.release()
            })
        })

        socket.on('new username', (userId, name) => {
            pool.getConnection((err, connection) => {
                if (err) return console.error(err)
    
                const updateMessages = 'SELECT id FROM messages WHERE userId=?'
                const updateUserName = 'UPDATE messages SET username=? WHERE userId=?'
    
                connection.execute(updateMessages, [userId], (err, messagesId) => {
                    if (err) return console.error(err)
                    if (messagesId.length === 0) return;
        
                    connection.execute(updateUserName, [name, userId], err => {
                        if (err) return console.error(err)
        
                        socket.emit('update username', name, messagesId)
                        socket.to('all').emit('update username', name, messagesId)
                    })
                })
                connection.release()
            })
        })

        socket.on('edit message', (text, id) => {
            pool.getConnection((err, connection) => {
                if (err) return console.error(err)
    
                const updateMessage = 'UPDATE messages SET text=? WHERE id=?'
    
                connection.execute(updateMessage, [text, id], err => {
                    if (err) return console.error(err)

                    if (text.includes('https://res.cloudinary.com/hajyom5vd/image/upload/')) {
                        text = `<img src="${text}" alt="nature">`
                    } else {
                        text = markdown.toHTML(text)
                        emoji.forEach((eitem) => {
                            text = text.replace(eitem.key, eitem.emoji)
                        })
                    }
        
                    socket.emit('update message', text, id)
                    socket.to('all').emit('update message', text, id)
                })
    
                connection.release()
            })
        })
    
        socket.on('delete message', id => {
            pool.getConnection((err, connection) => {
                if (err) return console.error(err)
    
                const deleteMessage = 'DELETE FROM messages WHERE id=?'
    
                connection.execute(deleteMessage, [id], err => {
                    if (err) return console.error(err)
        
                    socket.emit('deleted message', id)
                    socket.to('all').emit('deleted message', id)
                })
    
                connection.release()
            })
        })

    })
}