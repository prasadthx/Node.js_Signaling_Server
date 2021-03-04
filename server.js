import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

let io = new Server(httpServer,{
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log('user connected');
});

httpServer.listen(port, () => {
    console.log(`started on port: ${port}`);
});