import { useState, useEffect } from 'react';
import { GraduationCap, Loader2, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { getContract, formatDate } from '../utils/web3';
import type { Certificate } from '../utils/web3';

interface UserDashboardProps {
  account: string | null;
}

interface CertificateWithId extends Certificate {
  id: string;
}

export default function UserDashboard({ account }: UserDashboardProps) {
  const [certificates, setCertificates] = useState<CertificateWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (account) {
      loadUserCertificates();
    } else {
      setCertificates([]);
    }
  }, [account]);

  const loadUserCertificates = async () => {
    setIsLoading(true);
    setError('');

    try {
      const contract = await getContract();
      
      // Utiliser getCertificatesByStudent
      const certIds = await contract.getCertificatesByStudent(account);

      const certsData = await Promise.all(
        certIds.map(async (id: bigint) => {
          try {
            // Utiliser verifyCertificate pour obtenir les détails du certificat
            const certData = await contract.verifyCertificate(id);
            
            return {
              id: id.toString(),
              recipient: String(certData[2]), // student address
              courseName: String(certData[4]), // degree
              institutionName: String(certData[1]), // institution
              studentName: String(certData[3]), // studentName
              issuedDate: BigInt(Math.floor(new Date(String(certData[5])).getTime() / 1000)),
              isValid: Boolean(certData[0])
            };
          } catch (certError) {
            console.error(`Error loading certificate ${id}:`, certError);
            return null;
          }
        })
      );

      // Filtrer les certificats null et trier par date
      const validCerts = certsData.filter(cert => cert !== null) as CertificateWithId[];
      
      setCertificates(validCerts.sort((a, b) => {
        return Number(b.id) - Number(a.id);
      }));

    } catch (err: any) {
      console.error('Error loading certificates:', err);
      setError(err.message || 'Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card-premium bg-gradient-to-r from-indigo-50 to-blue-50 p-8 border-l-4 border-indigo-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <p className="text-indigo-900 font-medium">Connect your wallet to view your certificates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-8 fade-in">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-xl">
            <GraduationCap className="w-7 h-7 text-indigo-700" />
          </div>
          <div>
            <h2 className="section-title">My Certificates</h2>
            <p className="section-subtitle">Your verified blockchain credentials</p>
          </div>
        </div>
        {!isLoading && (
          <button
            onClick={loadUserCertificates}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading your certificates...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Error Loading Certificates</h3>
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={loadUserCertificates}
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
          <p className="text-gray-700 font-semibold text-lg">No Certificates Yet</p>
          <p className="text-gray-600 text-sm mt-2">Certificates issued to your address will appear here</p>
          <button
            onClick={loadUserCertificates}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium mb-4">
            You have <span className="text-indigo-600 font-bold">{certificates.length}</span> certificate{certificates.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert, index) => (
              <div
                key={cert.id}
                className="card group cursor-pointer p-6 bg-gradient-to-br from-white via-white to-indigo-50 hover:shadow-xl border-l-4 border-indigo-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <Award className="w-5 h-5 text-indigo-600" />
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
                    <span className="text-gray-600">Institution</span>
                    <span className="font-semibold text-gray-900">{cert.institutionName}</span>
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