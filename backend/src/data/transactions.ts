import mongoose, { Schema, Model, Document } from 'mongoose';

// Define the Issuer schema
const CertificateIssuanceSchema: Schema = new Schema({
  issuerId: {type:String , required : true},
  id: {type:String , required : true},
  issuerAddress: {type:String , required : true},
  isPrivate:{type:String , required : true,default:""},
},{
  collection:"issuances",
  
});

// Create the Certificate model
const  CertificateIssuance = mongoose.model('CertificateIssuance', CertificateIssuanceSchema);

export default CertificateIssuance;



