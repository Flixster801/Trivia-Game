const { io } = require('socket.io-client')

const MAX_PLAYERS = 4

var room = ''
var is_host = false
var num_players
var in_game = false
var role = ''

var question, answer

// const socket = io('http://192.168.4.61:3000') /* whatever local ip is */
const socket = io('http://localhost:3000') // CHANGE THIS WHEN RUNNING NON LOCALLY

var content = document.createElement('div')
content.classList.add('content')
document.body.appendChild(content)

function show_main_menu(error_message) {
    content.innerHTML = `
        <h style="font-size: 3em">Trivia</h>
        <p id="main-error-message" style="color: #ff6961; margin-bottom: 8px;">${error_message}</p>
        <input id="room-input" type="text" placeholder="Room Code" maxlength="4" autocomplete="off">
        <button id="join-button" type="button">Join Room</button>
        <p style="font-weight: 700;">or</p>
        <button id="create-button" type="button">Create Room</button>
    `
}

function show_wait_room(code, player_count, error_message, start_button) {
    content.innerHTML = `
        <h style="font-size: 3em">Waiting</h>
        <p id="room-code">Room Code: ${code}</p>
        <p id="player-count">Players: ${player_count}/${MAX_PLAYERS}</p>
        <p id="waiting-error-message" style="color: #ff6961;">${error_message}</p>
        ${start_button ? '<button id="start-button" type="button">Start</button>' : ''}
        <button id="leave-button" type="button" style="background: #ff6961;">Leave</button>
    `
}

function show_game(prompt, subtext, buttons, next, buzzer) {
    content.innerHTML = `
        <h>${prompt}</h>
        <p>${subtext}</p>
        ${buttons ?
        '<div>' +
        '    <button id="correct-button" type="button"><div class="check"></div></button>' +
        '    <button id="incorrect-button" type="button">&#215;</button>' +
        '    <br>' +
        '   <button id="skip-button" type="button">Skip</button>' +
        '</div>' : ''
        }
        ${next ? 
        '<div>' +
        '    <p>Wait for someone to buzz in</p>' +
        '    <p>or</p>' +
        '    <button id="next-button" type="button">Next</button>' +
        '</div>' : ''
        }
        ${buzzer ?
        '<button id="buzzer-button" type="button">Answer</button>' : ''
        }
    `
}

show_main_menu('')

document.addEventListener("click", event => {
    var e = event.target.closest("BUTTON")
    if (e == null || e.tagName != "BUTTON") return

    if (e.id == "join-button") {
        if (document.getElementById('room-input').value.toString().length != 4 || isNaN(document.getElementById('room-input').value)) {
            show_main_menu("Room doesn't exist")
            return
        }   
    
        is_host = false
        socket.emit('join-room', document.getElementById('room-input').value)
    }

    else if (e.id == "create-button") {
        is_host = true
        socket.emit('create-room')
    }

    else if (e.id == "start-button") {
        if (num_players < 2) {
            show_wait_room(room, num_players, "At least 2 people required to start", is_host)
            return
        }
        socket.emit('start-game')
    }

    else if (e.id == "leave-button") {
        socket.emit('leave-room')
        show_main_menu('')
    }

    else if (e.id == "correct-button" && role == 'questioner') {
        socket.emit('next-question')
    }

    else if (e.id == "incorrect-button" && role == 'questioner') {
        socket.emit('wrong-answer')
    }

    else if (e.id == "skip-button" && role == 'questioner') {
        socket.emit('skip-question')
    }
    
    else if (e.id == "buzzer-button" && role == 'spectator') {
        socket.emit('lock-in', () => {
            role = 'answerer'
            show_game("Answer the question", "", false, false, false)
        })
    }

    else if (e.id == "next-button" && role == 'questioner') {
        socket.emit('next-question')
    }
    
    else {
        console.log(`Unknown button '${e.id}' for role ${role}`)
    }
})

// temporary
socket.on('connect', () => {
    document.title = socket.id
})

socket.on('update-room', (code, players) => {
    if (in_game) location.reload()

    room = code
    num_players = players

    show_wait_room(room, num_players, '', is_host)
})

socket.on('begin-game', () => {
    in_game = true
})

socket.on('prompt-questioner', (q, a) => {
    role = 'questioner'
    question = q
    answer = a
    show_game(question, answer, true, false, false)
})

socket.on('prompt-answerer', () => {
    role = 'answerer'
    show_game("Answer the question", "", false, false, false)
})

socket.on('prompt-spectators', () => {
    role = 'spectator'
    show_game("You are on standby", "", false, false, false)
})

socket.on('bad-answer', () => {
    if (role == 'answerer') {
        show_game("Wrong answer", "Try again next time", false, false, false)
    }
    else if (role == 'spectator') {
        show_game("Now's your time to answer", "", false, false, true)
    }
    else if (role == 'questioner') {
        show_game(question, answer, false, true, false)
    }
})

socket.on('lock-out', () => {
    if (role == 'spectator') {
        show_game("Someone beat you to it", "", false, false, false)
    }
    else if (role == 'questioner') {
        show_game(question, answer, true, false, false)
    }
})

socket.on('main-menu-error', error => {
    show_main_menu(error)
})

socket.on('waiting-room-error'), error => {
    show_wait_room(room, player_count, error, false)
}

socket.on('test', message => {
    // gamePrompt.textContent = message
    console.log(message)
})