
import { createHash, publicDecrypt,verify,createVerify,constants } from 'crypto';
function verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verifyObject = verify(
        'sha256',
        Buffer.from(data),
        {
          key: publicKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(signature, 'base64')
      );
      return verifyObject;
    } catch (err) {
      console.error('Error verifying signature:', err);
      return false;
    }
  }
  
export async function verifyCertifcateData (data: any, signature: string,publicKey : string)  {
    return verifySignature(data,signature,publicKey);
    
    
  };
  