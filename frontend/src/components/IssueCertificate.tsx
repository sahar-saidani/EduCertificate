import { useState, useEffect } from 'react';
import { Award, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { getContract, isValidAddress } from '../utils/web3';

interface IssueCertificateProps {
  account: string | null;
}

export default function IssueCertificate({ account }: IssueCertificateProps) {
  const [formData, setFormData] = useState({
    recipientAddress: '',
    studentName: '',
    degree: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [certificateId, setCertificateId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isInstitution, setIsInstitution] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkInstitutionStatus = async () => {
      if (!account) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        const contract = await getContract();
        const institutionStatus = await contract.isInstitution(account);
        setIsInstitution(institutionStatus);
      } catch (err) {
        console.error('Error checking institution status:', err);
        setIsInstitution(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkInstitutionStatus();
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTxHash('');
    setCertificateId('');

    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      if (!isInstitution) {
        throw new Error('Your address is not authorized to issue certificates. Only approved institutions can issue certificates.');
      }

      if (!isValidAddress(formData.recipientAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getContract();

      const issuedDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

      console.log('Issuing certificate with:', {
        student: formData.recipientAddress,
        studentName: formData.studentName,
        degree: formData.degree,
        issuedDate: issuedDate
      });

      // Appel de la fonction du contrat
      const tx = await contract.issueCertificate(
        formData.recipientAddress,
        formData.studentName,
        formData.degree,
        issuedDate
      );

      setTxHash(tx.hash);
      console.log('Transaction sent:', tx);

      // Attendre la confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Parser l'événement CertificateIssued
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'CertificateIssued') {
              const certId = parsedLog.args.certificateId || parsedLog.args[0];
              setCertificateId(certId.toString());
              break;
            }
          } catch (parseError) {
            console.log('Could not parse log:', parseError);
          }
        }
      }

      // Réinitialiser le formulaire
      setFormData({
        recipientAddress: '',
        studentName: '',
        degree: '',
      });

    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      
      // Messages d'erreur plus spécifiques et clairs
      if (err.message.includes('user rejected transaction')) {
        setError('Transaction was rejected by user');
      } else if (err.message.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else if (err.message.includes('execution reverted')) {
        const revertMatch = err.message.match(/execution reverted: (.+?)(?="|$)/);
        setError(revertMatch ? revertMatch[1] : 'Transaction failed - check contract requirements');
      } else if (err.message.includes('not authorized') || err.message.includes('authorized')) {
        setError('🚫 Authorization Required: Your wallet address is not authorized to issue certificates. Only approved institutions can issue certificates.');
      } else {
        setError(err.message || 'Failed to issue certificate');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card-premium bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-l-4 border-blue-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <p className="text-blue-900 font-medium">Connect your wallet to issue certificates</p>
        </div>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="card-premium p-12 flex flex-col items-center justify-center fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Checking institution status...</p>
      </div>
    );
  }

  if (!isInstitution) {
    return (
      <div className="card-premium bg-gradient-to-r from-orange-50 to-red-50 p-8 border-l-4 border-orange-500 fade-in">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 mb-2 text-lg">Institution Access Required</h3>
            <p className="text-orange-800 mb-4">
              Your wallet address is not authorized to issue certificates. Only approved institutions can issue certificates.
            </p>
            <div className="bg-white/50 p-4 rounded-lg border border-orange-200">
              <p className="text-orange-700 font-semibold mb-2">How to resolve:</p>
              <ul className="text-orange-600 text-sm list-disc list-inside space-y-1">
                <li>Contact the contract administrator</li>
                <li>Ask to be added as an authorized institution</li>
                <li>Use the Admin Dashboard to add your address if you are the contract owner</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-8 fade-in">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
          <Award className="w-7 h-7 text-blue-700" />
        </div>
        <div>
          <h2 className="section-title">Issue New Certificate</h2>
          <p className="section-subtitle">Create and issue a new educational certificate</p>
        </div>
      </div>

      {/* Message de confirmation d'institution */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <p className="font-semibold mb-1">✓ Institution Authorized</p>
            <p className="text-green-700">
              Your wallet address is approved as an institution. You can issue certificates to students.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Recipient Address *
            </label>
            <input
              type="text"
              required
              value={formData.recipientAddress}
              onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
              placeholder="0x1234567890abcdef..."
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-2">Ethereum address that will receive the certificate</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              placeholder="John Doe"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Degree/Course Name *
          </label>
          <input
            type="text"
            required
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            placeholder="Blockchain Development 101"
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-2">
            The institution name is automatically taken from your connected wallet address
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Transaction...
            </>
          ) : (
            <>
              <Award className="w-5 h-5" />
              Issue Certificate
            </>
          )}
        </button>
      </form>

      {certificateId && (
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl animate-fadeIn">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-green-900 mb-4">Certificate Issued Successfully</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white/50 p-4 rounded-lg">
                  <p className="text-green-700 font-medium mb-1">Certificate ID</p>
                  <p className="font-mono text-gray-800 font-semibold">{certificateId}</p>
                </div>
                {txHash && (
                  <div className="bg-white/50 p-4 rounded-lg">
                    <p className="text-green-700 font-medium mb-1">Transaction Hash</p>
                    <p className="font-mono text-gray-800 text-xs break-all">{txHash}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl animate-fadeIn">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2 text-lg">Error</h3>
              <div className="space-y-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}