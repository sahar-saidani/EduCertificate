import { Router } from 'express';
import { addCertificateHandler, fundIssuerHandler, getAllCertificateHandler, getCertificate, getCertificateHash, IssueCertificateHandler } from '../handlers/certificateHandler';
import { addIssuerHandler, getIssuerAddressHandler } from '../handlers/issuerHandler';

const router = Router();


router
.get('/certificate/:id', getCertificate)
.get('/issuer/:id/address',getIssuerAddressHandler)
.post('/issuer',addIssuerHandler)
.get('/:address/certificateHash',getCertificateHash)
.get('/:address/transferAuth',fundIssuerHandler)
.get('/:issuerId/certificates',getAllCertificateHandler)
.post('/:issuerId/certificate',addCertificateHandler)
.post('/certificate',IssueCertificateHandler)
export default router;
