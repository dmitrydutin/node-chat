const express = require('express')
const routes = require('./routes/router')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server, {serveClient: true})

app.use(routes)
require('./socket')(io)

server.listen(process.env.PORT || 3000)