import Certificate from "../data/cert";
import CertificateIssuance from "../data/transactions";


export async function addCertificateIssuance(certId: string,issuerAddress : string,issuerId: string ,isPrivate : boolean ) {
    try {
        const get = await CertificateIssuance.find()
       const certI = new  CertificateIssuance({
        issuerId:issuerId,
        id: certId,
        issuerAddress: issuerAddress,
        isPrivate:isPrivate
       })
      const saved = await certI.save()
      console.log(saved.isNew)
    } catch (error) {
        console.error('Error fetching certificate:', error);
        throw error;
    }
}


export async function getAllcertificates(issuerId: string , ) {
    try {
        const certificates = await Certificate.find({ issuerId });
        let listofcerts : any[];
        certificates.forEach(cert =>{
            listofcerts.push({
                "certId":cert.id,
                "certName":cert.certName,
                "issuerId":cert.issuerId,
                "certType":cert.certType,
                "certUrl":cert.certUrl
            })
        })
        return certificates
    } catch (error) {
        console.error('Error fetching certificate:', error);
        throw error;
    }
}




export async function addCertificate(issuerId: string ,certName : string , certType : string, certUrl : string , ) {
    try {
        const certificate =new Certificate(
            {
                issuerId:issuerId,
                certName:certName,
                certType:certType,
                certUrl:certUrl

            }
        )
       await certificate.save()
    } catch (error) {
        console.error('Error fetching certificate:', error);
        throw error;
    }
}