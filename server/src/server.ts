import cookieParser from "cookie-parser";
import * as cors from "cors";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { WebSocket, WebSocketServer } from "ws";
import prisma from "./prisma";
import userRouter from "./routes/userRoute";

dotenv.config({ path: __dirname + "../.env" });

const port = process.env.PORT || 8080;
const corsOptions: cors.CorsOptions = {
  origin: "*",
};

const app = express();

app.use(cors.default(corsOptions));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

const connections = {};
const users = {};

// Routes
app.use("/api/v1/user", userRouter);
// WebSockets
const wsServer = new WebSocketServer({ server });

wsServer.on("connection", (socket: WebSocket, request: Request) => {
  const userId = uuidv4();
  console.log("New connection", socket);

  socket.on("close", () => handleClose(userId));
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World" });
});

server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await prisma.$connect();
  console.log("Database connected");
});

function broadcast() {}

function handleClose(uuid: string) {}
