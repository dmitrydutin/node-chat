const express = require('express')
const path = require('path')
const app = express()

app.set("view engine", "hbs")
app.set('views', path.join(__dirname, '..', '..', 'client', 'views'))
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'public')))

app.get('/', (req, res) => {
    res.render('index')
})

module.exports = app