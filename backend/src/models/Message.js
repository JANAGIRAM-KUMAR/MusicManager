import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { // User id of the sender
        type: String,
        required: true
    },
    receiverId: { // User id of the receiver
        type: String,
        required: true
    },
    content: {
         type: String,
            required: true
        }
}, {timestamps: true});
    
const Message = mongoose.model('Message', messageSchema);
export default Message;