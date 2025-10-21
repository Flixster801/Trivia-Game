const { instrument } = require('@socket.io/admin-ui')
const data = require('./questions.json')

const NUM_QUESTIONS = data.questions.length
const MAX_ROOMS = 10000
const MAX_PLAYERS = 4

var rooms = {}

var lockins = Array(MAX_ROOMS).fill(false)

for (var i = 0; i < MAX_ROOMS; i++) {
    rooms[i.toString().padStart(4, '0')] = 0 // 0: free, 1: joinable, 2: closed
}

const io = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:1234', 'https://admin.socket.io'],
        credentials: true,
    },
})

io.on("connection", socket => {
    console.log(socket.id)

    socket.on('join-room', room => {
        console.log('Joining room...')

        if (!io.sockets.adapter.rooms.get(room)) {
            io.to(socket.id).emit('main-menu-error', "Room doesn't exist")
            return
        }

        var num_players = io.sockets.adapter.rooms.get(room).size + 1
        if (num_players > MAX_PLAYERS) {
            io.to(socket.id).emit('main-menu-error', "Room already full")
            return
        }

        if (rooms[room] != 1) {
            io.to(socket.id).emit('main-menu-error', "Room not available")
            return
        }

        socket.join(room)
        io.to(room).emit('update-room', room, num_players)
        console.log(`Joined room ${room} with ${num_players} players`)
    })

    socket.on('create-room', () => {
        console.log('Creating room...')

        var free_rooms = Object.keys(rooms).filter(key => rooms[key] == 0)

        if (free_rooms.size == 0) {
            io.to(socket.id).emit('main-menu-error', "No available rooms")
            return
        }

        var room = free_rooms[free_rooms.length * Math.random() << 0]
        rooms[room] = 1

        socket.join(room)
        io.to(room).emit('update-room', room, 1)
        console.log(`Created room ${room}`)
    })

    socket.on('disconnecting', () => {
        leaveRoom(socket)
    })

    socket.on('leave-room', () => {
        leaveRoom(socket)
    })

    socket.on('start-game', () => {
        var room = Array.from(socket.rooms)[1]
        io.to(room).emit('begin-game')
        promptPlayers(socket)
        rooms[room] = 2
        console.log(`Room ${room} is starting a game`)
    })

    socket.on('next-question', () => {
        var room = Array.from(socket.rooms)[1]
        lockins[parseInt(room)] = false
        promptPlayers(socket)
    })

    socket.on('wrong-answer', () => {
        var room = Array.from(socket.rooms)[1]
        lockins[parseInt(room)] = false
        io.to(room).emit('bad-answer')
    })

    socket.on('lock-in', callback => {
        console.log("lock in from", socket.id)
        var room = Array.from(socket.rooms)[1]
        if (lockins[parseInt(room)] == false) {
            socket.to(room).emit('lock-out')
            callback()
            lockins[parseInt(room)] = true
            console.log('locked in')
        }
        else {
            console.log('failed lock in')
        }
    })

    socket.on('skip-question', () => {
        var q_index = Math.random() * NUM_QUESTIONS << 0
        io.to(socket.id).emit('prompt-questioner', data.questions[q_index], data.answers[q_index])
    })
})

function leaveRoom(socket) {
    var room = Array.from(socket.rooms)[1]
    socket.leave(room)
    if (io.sockets.adapter.rooms.get(room)) {
        io.to(room).emit('update-room', room, io.sockets.adapter.rooms.get(room).size)
        console.log(`Leaving room: ${room} | Room now has ${io.sockets.adapter.rooms.get(room).size} players`)
    }
    else {
        rooms[room] = 0
    }
}

function promptPlayers(socket) {
    var room = Array.from(socket.rooms)[1]
    var players = Array.from(io.sockets.adapter.rooms.get(room))
    var answerer = players.indexOf(socket.id)
    var questioner = (answerer + 1) % players.length
    var q_index = Math.random() * NUM_QUESTIONS << 0

    // send question to questioner
    io.to(players[questioner]).emit('prompt-questioner', data.questions[q_index], data.answers[q_index])
    // let answerer know they need to answer
    io.to(players[answerer]).emit('prompt-answerer')
    // let everyone else know they're on standby
    io.to(room).except(players[questioner]).except(players[answerer]).emit('prompt-spectators')
}

instrument(io, { auth: false })