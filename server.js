import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import route from './src/routes'

const app = express();
const httpServer = createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
});

httpServer.listen(port, () => {
    console.log(`started on port: ${port}`);
});
