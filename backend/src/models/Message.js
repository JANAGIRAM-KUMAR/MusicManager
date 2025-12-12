import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { // clerkId of the sender
        type: String,
        required: true
    },
    receiverId: { // clerkId of the receiver
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