# Trivia Game

A trivia game shell to add questions to. 

## Setting up

### Server

In the server directory, run the command:

```bash
npm start
```

This will start the backend server and display information about what is currenlty happening. Make sure to add the address of the frontend server to the array on line 18 of ```server.js```.

### Client

In the client directory, run the command:
```bash
npm run devStart
```

This will start the frontend server that the client connects to. Ensure that the ip address on line 14 of ```client.js``` matches with the ip of the backend server.

## How to play

One person must create a room, which will present them with a 4 digit code which other players must enter to join. To start the game, the person who created the room can press the start button once at least one other person joins.

When the game starts, one person will get a question and answer pair along with two buttons: a checkmark and a cross. Another person will be prompted to answer the question. The questioner should determine if the answer matches the one provided and press the corresponding button. If the checkmark was pressed, the questioner becomes the next answerer and someone else will ask the question. Otherwise, if the answer was incorrect, the other players will get the option to jump in to answer the question. This will repeat until nobody can answer the question.

## Making changes

To change the questions and answers, edit the ```questions.json``` file in the server directory. 

To change the maximum number of players, change the ```MAX_PLAYERS``` constant at the top of ```server.js```.
