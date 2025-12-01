import { useState, useEffect } from 'react';
import { Building2, Loader2, Award, AlertCircle, RefreshCw, Trash2, UserCheck } from 'lucide-react';
import { getContract, formatDate, shortenAddress } from '../utils/web3';

interface InstitutionDashboardProps {
  account: string | null;
}

interface CertificateWithId {
  id: string;
  recipient: string;
  courseName: string;
  institutionName: string;
  studentName: string;
  issuedDate: bigint;
  isValid: boolean;
}

export default function InstitutionDashboard({ account }: InstitutionDashboardProps) {
  const [certificates, setCertificates] = useState<CertificateWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isInstitution, setIsInstitution] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      checkInstitutionStatus();
    }
  }, [account]);

  const checkInstitutionStatus = async () => {
    try {
      const contract = await getContract();
      const institutionStatus = await contract.isInstitution(account);
      setIsInstitution(institutionStatus);
      
      if (institutionStatus) {
        loadInstitutionCertificates();
      }
    } catch (err: any) {
      console.error('Error checking institution status:', err);
      setError('Failed to verify institution status');
    }
  };

  const loadInstitutionCertificates = async () => {
    setIsLoading(true);
    setError('');

    try {
      const contract = await getContract();
      
      // Charger tous les certificats émis par cette institution
      // Note: Cette approche nécessite de parcourir tous les IDs
      // Dans un vrai projet, vous voudriez suivre les IDs émis par l'institution
      const certificateCounter = await contract.certificateCounter();
      const totalCerts = Number(certificateCounter);
      
      const institutionCerts: CertificateWithId[] = [];
      
      // Parcourir les certificats (attention: peut être lent pour un grand nombre)
      for (let i = 1; i <= totalCerts; i++) {
        try {
          const certData = await contract.verifyCertificate(i);
          const institution = String(certData[1]);
          
          // Vérifier si ce certificat a été émis par cette institution
          if (institution.toLowerCase() === account?.toLowerCase()) {
            institutionCerts.push({
              id: i.toString(),
              recipient: String(certData[2]),
              courseName: String(certData[4]),
              institutionName: institution,
              studentName: String(certData[3]),
              issuedDate: BigInt(Math.floor(new Date(String(certData[5])).getTime() / 1000)),
              isValid: Boolean(certData[0])
            });
          }
        } catch (e) {
          // Ignorer les certificats qui n'existent pas ou erreurs de lecture
          continue;
        }
      }
      
      setCertificates(institutionCerts.sort((a, b) => Number(b.id) - Number(a.id)));

    } catch (err: any) {
      console.error('Error loading institution certificates:', err);
      setError(err.message || 'Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    setRevokingId(certificateId);
    setError('');

    try {
      const contract = await getContract();
      const tx = await contract.revokeCertificate(Number(certificateId));
      await tx.wait();
      
      // Recharger la liste des certificats
      await loadInstitutionCertificates();
      
    } catch (err: any) {
      console.error('Error revoking certificate:', err);
      setError(err.message || 'Failed to revoke certificate');
    } finally {
      setRevokingId(null);
    }
  };

  if (!account) {
    return (
      <div className="card-premium bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-l-4 border-blue-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <p className="text-blue-900 font-medium">Connect your wallet to manage certificates</p>
        </div>
      </div>
    );
  }

  if (!isInstitution) {
    return (
      <div className="card-premium bg-gradient-to-r from-orange-50 to-red-50 p-8 border-l-4 border-orange-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div>
            <p className="text-orange-900 font-medium">Institution Access Required</p>
            <p className="text-orange-700 text-sm mt-1">
              Your wallet address is not authorized as an institution. Only approved institutions can manage certificates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-8 fade-in">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
            <Building2 className="w-7 h-7 text-purple-700" />
          </div>
          <div>
            <h2 className="section-title">Institution Dashboard</h2>
            <p className="section-subtitle">Manage certificates issued by your institution</p>
          </div>
        </div>
        {!isLoading && (
          <button
            onClick={loadInstitutionCertificates}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading certificates...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={loadInstitutionCertificates}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">No Certificates Issued</p>
          <p className="text-gray-600 text-sm mt-2">Certificates issued by your institution will appear here</p>
          <button
            onClick={loadInstitutionCertificates}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium mb-4">
            Your institution has issued <span className="text-purple-600 font-bold">{certificates.length}</span> certificate{certificates.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4">
            {certificates.map((cert, index) => (
              <div
                key={cert.id}
                className="card group p-6 bg-gradient-to-br from-white via-white to-purple-50 hover:shadow-xl border-l-4 border-purple-500 relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Bouton de suppression */}
                <button
                  onClick={() => handleRevokeCertificate(cert.id)}
                  disabled={revokingId === cert.id || !cert.isValid}
                  className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={cert.isValid ? "Revoke certificate" : "Certificate already revoked"}
                >
                  {revokingId === cert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{cert.id}
                    </span>
                  </div>
                  {cert.isValid ? (
                    <span className="badge badge-success">Valid</span>
                  ) : (
                    <span className="badge badge-error">Revoked</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{cert.courseName}</h3>
                <p className="text-sm font-semibold text-gray-700 mb-4">{cert.studentName}</p>

                <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Student Address</span>
                    <span className="font-mono text-gray-900 text-xs">{shortenAddress(cert.recipient)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issued</span>
                    <span className="font-semibold text-gray-900">{formatDate(cert.issuedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-semibold ${cert.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {cert.isValid ? 'Valid' : 'Revoked'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}