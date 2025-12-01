import mongoose, { Schema, Model, Document } from 'mongoose';

// Define the Issuer schema
const IssuerSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },

  phoneNumber : {type : String , required:true},
  address:{type : String  , required : true , default:null},
},{collection:"issuers"});

// Create the Issuer model
const  Issuer = mongoose.model('Issuer', IssuerSchema);

export default Issuer;




