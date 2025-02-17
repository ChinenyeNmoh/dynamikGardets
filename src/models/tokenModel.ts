import { hash } from "crypto";
import {Schema, model, Document} from "mongoose";


export interface IToken extends Document {
    userId: Schema.Types.ObjectId;
    token: string;
    type: string;
    expireAt: Date;
}


const tokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
        unique: true,
    },
    token: { 
        type: String,
        required: true 
    },
    type: { 
        type: String, 
        enum: ['verification', 'passwordReset'], 
        required: true 
      },
    expireAt: { 
        type: Date,
        expires:   60 * 60,
        index: true, 
        default: Date.now,
    }
});

export default  model<IToken>("Token", tokenSchema);