import { createServer } from "http";
import express from "express";
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import route from './src/routes'
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
route(app);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});



let io = new Server(httpServer,{
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    }
});

const port = process.env.PORT;

var time = 0;
io.on('connection', (socket) => {
    time += 1
    console.log('user connected: '+time+'time');
    socket.on("join",(roomName)=>{
        console.log(roomName)
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomName);
        let roomStatus;
        //room == undefined when no such room exists.
        if (room === undefined) {
            socket.join(roomName);
            roomStatus = 'created'
            socket.emit('joined',roomStatus);
        } else if (room.size === 1) {
            //room.size == 1 when one person is inside the room.
            socket.join(roomName);
            roomStatus = 'joined'
            socket.emit('joined',roomStatus);
        } else {
            //when there are already two people inside the room.
            socket.emit("full");
        }
        console.log(rooms);
    });
    socket.on("ready", (roomName) => {
        socket.broadcast.to(roomName).emit("ready"); //Informs the other peer in the room.
    });

    //Triggered when server gets an icecandidate from a peer in the room.
    socket.on("candidate", function (candidate, roomName) {
        console.log(candidate);
        socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
    });

    //Triggered when server gets an offer from a peer in the room.

    socket.on("offer", function (offer, roomName) {
        socket.broadcast.to(roomName).emit("offer", offer); //Sends Offer to the other peer in the room.
    });

    //Triggered when server gets an answer from a peer in the room.

    socket.on("answer", function (answer, roomName) {
        socket.broadcast.to(roomName).emit("answer", answer); //Sends Answer to the other peer in the room.
    });
});

httpServer.listen(port, () => {
    console.log(`started on port: ${port}`);
});
