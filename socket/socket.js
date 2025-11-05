// socket/socket.js - FIXED VERSION
import {Server} from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin:['http://localhost:3000'],
        methods:['GET', 'POST'],
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

const userSocketMap = {};

io.on('connection', (socket)=>{
    const userId = socket.handshake.query.userId;
    
    console.log(`🔌 User connected: ${userId}, Socket: ${socket.id}`);
    
    if(userId !== undefined){
        userSocketMap[userId] = socket.id;
    } 

    console.log(`👥 Online users: ${Object.keys(userSocketMap).join(', ')}`);
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // ✅ Join user to their personal room
    socket.on('joinUser', (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their room`);
    });

    // ✅ Handle sending messages - FIXED
    socket.on('sendMessage', async (messageData) => {
        console.log('📤 SEND MESSAGE EVENT:', {
            from: messageData.senderId,
            to: messageData.receiverId,
            message: messageData.message,
            tempId: messageData.tempId // ✅ Important: Get temp ID from frontend
        });
        
        const { receiverId, senderId, message, tempId } = messageData;
        
        // ✅ Use the SAME temp ID that frontend sent
        const messageObj = {
            _id: tempId || Date.now().toString(), // ✅ Use frontend's temp ID
            message: message,
            senderId: senderId,
            receiverId: receiverId,
            createdAt: new Date().toISOString(),
            status: 'sent' // ✅ Immediately mark as sent
        };
        
        console.log(`📩 Sending message with ID: ${messageObj._id}`);
        
        // ✅ 1. Send to receiver
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('newMessage', messageObj);
            console.log(`✅ Message sent to receiver: ${receiverId}`);
            
            // ✅ 2. Immediately mark as SENT to sender
            const senderSocketId = userSocketMap[senderId];
            if (senderSocketId) {
                // First mark as SENT immediately
                socket.to(senderSocketId).emit('messageSent', {
                    messageId: messageObj._id,
                    receiverId: receiverId
                });
                console.log(`📤 Message marked as SENT to sender: ${senderId}`);
                
                // Then mark as DELIVERED after delay
                setTimeout(() => {
                    socket.to(senderSocketId).emit('messageDelivered', {
                        messageId: messageObj._id,
                        receiverId: receiverId
                    });
                    console.log(`📨 Message marked as DELIVERED to sender: ${senderId}`);
                }, 800);
            }
        } else {
            console.log(`❌ Receiver ${receiverId} is OFFLINE`);
            
            // Even if receiver is offline, mark as sent to sender
            const senderSocketId = userSocketMap[senderId];
            if (senderSocketId) {
                socket.to(senderSocketId).emit('messageSent', {
                    messageId: messageObj._id,
                    receiverId: receiverId
                });
            }
        }
    });

    // ✅ Handle mark as read
    socket.on('markAsRead', (data) => {
        console.log('📖 MARK AS READ EVENT:', data);
        const { messageIds, receiverId, senderId } = data;
        
        // ✅ Notify sender that messages were read
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
            socket.to(senderSocketId).emit('messageRead', {
                messageIds: Array.isArray(messageIds) ? messageIds : [messageIds],
                readBy: receiverId
            });
            console.log(`👀 MESSAGE READ - Notified ${senderId} that ${receiverId} read ${messageIds.length} messages`);
        } else {
            console.log(`❌ Sender ${senderId} OFFLINE - cannot notify about read status`);
        }
    });

    // ✅ Handle mark as seen
    socket.on('markAsSeen', (data) => {
        console.log('👁️ MARK AS SEEN EVENT:', data);
        const { messageIds, receiverId, senderId } = data;
        
        // ✅ Notify sender that messages were seen
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
            socket.to(senderSocketId).emit('messageSeen', {
                messageIds: Array.isArray(messageIds) ? messageIds : [messageIds],
                seenBy: receiverId
            });
            console.log(`👁️ MESSAGE SEEN - Notified ${senderId} that ${receiverId} seen ${messageIds.length} messages`);
        } else {
            console.log(`❌ Sender ${senderId} OFFLINE - cannot notify about seen status`);
        }
    });

    socket.on('disconnect', ()=>{
        console.log(`❌ User disconnected: ${userId}`);
        delete userSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });

});

export {app, io, server};