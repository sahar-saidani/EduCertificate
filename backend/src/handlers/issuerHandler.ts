import { addIssuerAptos } from "../services/aptosService";
import { addIssuer, getIssuerAddress } from "../services/issuerService";
import { Request, Response } from 'express';

export async function getIssuerAddressHandler(req : Request , res : Response) {
    try {
     const issuerId = req.params.id;
     const issuerAddress =  await getIssuerAddress(issuerId);
 
       res.json({
         'address': issuerAddress,
     
       });
    
    } catch (error) {
     console.log(error)
    }
    return null;
 }
 
 export async function addIssuerHandler(req : Request , res : Response) {
  try {

    const issuerData = req.body;
   const issuer =  await addIssuer(issuerData);
   console.log(issuer)
   if(issuer != null){
   const aptosAdd =  await  addIssuerAptos(issuer.address as string)
   console.log(aptosAdd)
     res.json({
       'address': issuer.address,
       'id':issuer.id
       
   
     });

   }
  
  
  } catch (error) {
   console.log(error)
  }
  return null;
}
