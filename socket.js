import { Server } from "socket.io";
import ChatModel from "./src/models/Message.js";

const connectedUsers = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000", // Local frontend (for development)
        "https://x-found.netlify.app",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("register", (userId) => {
      connectedUsers.set(userId, socket.id);
    });

    socket.on("send_message", async (messageData) => {
      try {
        // Save message to database
        const newMessage = await ChatModel.findByIdAndUpdate(
          messageData.chatId,
          {
            $push: {
              messages: {
                sender: messageData.senderId,
                content: messageData.content,
              },
            },
          },
          { new: true }
        );

        // Emit to recipient if online
        const recipientSocketId = connectedUsers.get(messageData.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", newMessage);
        }

        // Emit back to sender for confirmation
        socket.emit("message_sent", newMessage);
      } catch (error) {
        console.error("Message sending error:", error);
      }
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

export default setupSocket;
