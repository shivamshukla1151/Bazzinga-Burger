const a = require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-Ejs-layouts')
const PORT = process.env.PORT || 3000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')
const passport = require('passport')
const favicon = require('serve-favicon')
const Emitter = require('events')

//Database connection
const url = 'mongodb://localhost:27017/Bazzinga';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected...');
})

//Session store
// let mongoStore = new MongoDbStore({
//     mongooseConnection: connection,
//     collection: 'sessions'
// })
// Event emitter
//session config
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoDbStore.create({
        mongoUrl: url
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } //24 hours
}))

//Passport congfig
const passportInit = require('./app/config/passport')
const { dirname } = require('path')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())



app.use(flash())
//Assets
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//Global middleware
app.use((req,res,next)=>{
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})
//set Template engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')
//app.use(favicon(path.join(__dirname,'/public/img/logo.png')))


require('./routes/web')(app)



const server = app.listen(PORT , () => {
    console.log(`listening on port ${PORT}`)
})

//Socket

const io = require('socket.io')(server)

io.on('connection',(socket)=>{
       //Join 
       
       socket.on('join', (orderId) =>{
         socket.join(orderId)
       })

})

eventEmitter.on('orderUpdated', (data) => {
    //console.log('data')
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})
eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})
