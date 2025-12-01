import mongoose, { Schema, Model, Document } from 'mongoose';

// Define the Issuer schema
const CertificateSchema: Schema = new Schema({
  issuerId: {type:String , required : true},
  certName: {type:String , required : true},
  certType: {type:String , required : true,default:""},
  certUrl:{type:String , required : false},
});

// Create the Certificate model
const  Certificate = mongoose.model('Certificate', CertificateSchema);

export default Certificate;

