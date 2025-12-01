import { useState } from 'react';
import { UserPlus, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { getContract, isValidAddress } from '../utils/web3';

interface AddInstitutionProps {
  account: string | null;
  isOwner: boolean;
}

export default function AddInstitution({ account, isOwner }: AddInstitutionProps) {
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTxHash('');
    setSuccess(false);

    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      if (!isOwner) {
        throw new Error('Only contract owner can add institutions');
      }

      if (!isValidAddress(institutionAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getContract();
      console.log('Adding institution:', institutionAddress);

      const tx = await contract.addInstitution(institutionAddress);
      setTxHash(tx.hash);

      console.log('Transaction sent:', tx);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setSuccess(true);
      setInstitutionAddress('');

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      console.error('Error adding institution:', err);
      
      if (err.message.includes('user rejected transaction')) {
        setError('Transaction was rejected by user');
      } else if (err.message.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else if (err.message.includes('execution reverted')) {
        const revertMatch = err.message.match(/execution reverted: (.+?)(?="|$)/);
        setError(revertMatch ? revertMatch[1] : 'Transaction failed');
      } else {
        setError(err.message || 'Failed to add institution');
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
          <p className="text-blue-900 font-medium">Connect your wallet to manage institutions</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="card-premium bg-gradient-to-r from-orange-50 to-red-50 p-8 border-l-4 border-orange-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <p className="text-orange-900 font-medium">Only contract owner can manage institutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-8 fade-in">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
          <Building2 className="w-7 h-7 text-purple-700" />
        </div>
        <div>
          <h2 className="section-title">Manage Institutions</h2>
          <p className="section-subtitle">Add authorized institutions to issue certificates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Institution Wallet Address
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={institutionAddress}
              onChange={(e) => setInstitutionAddress(e.target.value)}
              placeholder="0x1234567890abcdef..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={isLoading || !institutionAddress}
              className="btn-primary bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Add Institution
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter the Ethereum address of the institution you want to authorize
          </p>
        </div>
      </form>

      {success && (
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl animate-fadeIn">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-green-900 mb-2">Institution Added Successfully</h3>
              <p className="text-green-700 text-sm mb-3">
                The institution has been authorized to issue certificates.
              </p>
              {txHash && (
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-green-700 font-medium mb-1 text-xs">Transaction Hash</p>
                  <p className="font-mono text-gray-800 text-xs break-all">{txHash}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl animate-fadeIn">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Institution Management</p>
            <p className="text-blue-700">
              Authorized institutions can issue and revoke certificates. Only the contract owner can manage this list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}