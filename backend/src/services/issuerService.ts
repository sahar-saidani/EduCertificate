import mongoose, { Types } from "mongoose";
import  Issuer  from "../data/issuer";
import Transaction from "../data/transactions";

export async function fetchIssuer(issuerId:string) {
    try {
     const issuer = await Issuer.findById(Types.ObjectId.createFromHexString(issuerId))
     return issuer;
    } catch (error) {
        console.log(error)
    }
    return null;
    
}

export async function addIssuer(payload : any) {
    try {
     const issuer = new Issuer({
        name: payload.name,
        type: payload.type,
     
        phoneNumber : payload.phoneNumber,
       
        address:payload.address,
       
     })
     await  issuer.save()
     return issuer;
    } catch (error) {
        console.log(error)
    }
    return null;
    
}


export async function addTransaction(transactionHash :string,issuerId : string , gas : number) {
    try {
     const transaction = new Transaction({
        hash:transactionHash,
        gas:gas,
        issuerId:issuerId

     })
     await  transaction.save()
     return ;
    } catch (error) {
        console.log(error)
    }
    return null;
    
}


export async function getIssuerAddress(issuerId : string ): Promise<string>{
    try {
     const issuer = await Issuer.findById(issuerId);
     if(issuer != null){
        const address = issuer.address as string
        return address ;
     }
    } catch (error) {
        console.log(error)
    }
    return "";
    
}

