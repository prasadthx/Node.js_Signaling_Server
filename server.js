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
    time += 1;
    console.log('user connected: '+time+'time');
    socket.on('joinAsHost', (roomName) => {
        console.log("-------------/////////////////////////#######################");
        socket.join(roomName);
        console.log(roomName);
        let room = io.sockets.adapter.rooms.get(roomName);
        room.host = socket.id;
        console.log(room);
    })
    socket.on("join",(roomName, userName)=>{
        console.log(`${roomName}1`)
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(`${roomName}1`);
        console.log("/////////////////////////########################//////////////////////");
        console.log("This is room: "+room);
        let roomStatus;
        //room == undefined when no such room exists.
        if (room === undefined) {
            roomStatus = 'No such meeting ID exists';
            socket.emit('undefinedRoom',roomStatus);
        }
        else {
            // When room exists.
            socket.join(`${roomName}1`);
            roomStatus = 'newPeer'
            io.to(room.host).emit('acceptRejectCall',{'userName': userName, 'socketId': socket.id});
        }
        console.log(rooms);
    });

    socket.on('callRejected',(socketId)=>{
        io.to(socketId).emit('callCancelled');
    })

    socket.on("ready", (roomName, socketId) => {
        io.to(socketId).emit("ready", roomName, socketId); //Informs the peer to start connection in the room.
    });

    //Triggered when server gets an icecandidate from a peer in the room.
    socket.on("candidate", function (candidate, roomName) {
        console.log(candidate);
        socket.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
    });

    //Triggered when server gets an offer from a peer in the room.

    socket.on("offer", function (offer, roomName, socketId) {
        socket.to(roomName).emit("offer", offer, socketId); //Sends Offer to the other peer in the room.
    });

    //Triggered when server gets an answer from a peer in the room.

    socket.on("answer", function (answer, socketId) {
        io.to(socketId).emit("answer", answer); //Sends Answer to the other peer in the room.
    });
});

httpServer.listen(port, () => {
    console.log(`started on port: ${port}`);
});
