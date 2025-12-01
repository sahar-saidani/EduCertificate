import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, RawTransaction, TransactionPayload } from '@aptos-labs/ts-sdk';
import { AptosClient, AptosAccount, TokenClient, TokenTypes, HexString, aptosRequest, Ledger_Infos_Select_Column, TxnBuilderTypes } from 'aptos';
import { ADMIN_ADDRESS, PRIVATE_KEY } from '../utils/consts';
import { aw } from '@aptos-labs/ts-sdk/dist/common/accountAddress-D9blTwwp';

const aptosConfig = new AptosConfig({ fullnode: "https://fullnode.devnet.aptoslabs.com/v1" });
const aptos = new Aptos(aptosConfig)
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');





const admin = Account.fromPrivateKey({privateKey:new Ed25519PrivateKey(PRIVATE_KEY)})


export async function estimateTransactionCost() : Promise<number>{
  return 1000;
}

export async function fundIssuer(toAddress:string,amount : number) {
 

  const transaction = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function:
         `0x1::aptos_account::transfer`,
        // Pass in arguments for the function you specify above
        functionArguments: [
          admin.accountAddress.toString(),amount
          // details de certif
        ],
      },
     })
     console.log(toAddress)


  const signedTransaction =await aptos.signAndSubmitTransaction({signer:admin,transaction:transaction});
  const commitedTransaction =  await aptos.waitForTransaction({transactionHash:signedTransaction.hash});
    
  return commitedTransaction.success

 } 

export async function getCertificateFromAptos(certficateIssuanceId: String) {

  try {
    try {
 
   
        // Call the function
        const result = await client.view(
             {
              arguments:[ADMIN_ADDRESS,certficateIssuanceId],
              function:   `${ADMIN_ADDRESS}::CertManagement::get_certificate_issuance`,
              type_arguments: [],
     
             }
            
        );

        
        return {
          certificateId: result.at(0),
          certificateIssuanceId: result.at(1),
          ReciepientName: result.at(2),
          ReciepientEmail: result.at(3),
          ReciepientPhotoUrl: result.at(4),
          certificateUrl: result.at(5),
          certificateDesc: result.at(6),
          issuanceDate: result.at(7),


        }
    } catch (error) {
        console.error('Error calling function:', error);
        return null;
    }

  } catch (error) {
    console.log(error)
  }
  return null;
  
}

export async function addIssuerAptos(issuer:string) {
 
  const transaction = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        functionArguments:[issuer],
        function:   `${ADMIN_ADDRESS}::CertManagement::add_approved_issuer`,
      },
     })


  const signedTransaction =await aptos.signAndSubmitTransaction({signer:admin,transaction:transaction});
  const commitedTransaction =  await aptos.waitForTransaction({transactionHash:signedTransaction.hash});
    
  return commitedTransaction.success

 } 

   // Request to server to get moduleAdress
   export  async function issueCertificateToAptos(moduleAddress:string,hash:string,data : any ) {
    try{       // To issue certificate call this 
       const moduleName = 'CertManagement'; // Move module name
       const functionName = 'issue_cert'; // Move function name
       const admin = Account.fromPrivateKey({privateKey:new Ed25519PrivateKey(PRIVATE_KEY)})

     const transaction = await aptos.transaction.build.simple({
       sender: admin.accountAddress,
       data: {
         function:
          `${moduleAddress}::${moduleName}::${functionName}`,
         // Pass in arguments for the function you specify above
         functionArguments: [
           hash,
           data.recipientName,
           data.recipientEmail,
           data.recipientPhoto,
           data. certUrl,
           data. certificateId,
           data. issueDate,
           data.description,
           data.issuer

           
         ],
       },
      })
    const transactionSigned = await aptos.signAndSubmitTransaction({signer:admin,transaction:transaction});
     const commitedTransaction =  await aptos.waitForTransaction({transactionHash:transactionSigned.hash});
     
     return {
     "result":  commitedTransaction.success,
     "hash": commitedTransaction.hash

     }
   }
     catch(e){
       console.log(e);
       return false;
     }
  }
   