import { useState, useEffect } from 'react';
import { Shield, Award, Users, TrendingUp, Loader2, AlertCircle, CheckCircle, Building2, UserPlus, Coins } from 'lucide-react';
import { getContract, shortenAddress } from '../utils/web3';

interface AdminDashboardProps {
  account: string | null;
}

export default function AdminDashboard({ account }: AdminDashboardProps) {
  const [totalCertificates, setTotalCertificates] = useState<number>(0);
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [isAddingInstitution, setIsAddingInstitution] = useState(false);
  const [addInstitutionError, setAddInstitutionError] = useState('');
  const [addInstitutionSuccess, setAddInstitutionSuccess] = useState(false);
  const [accountBalance, setAccountBalance] = useState<string>('0');

  // Read Vite env safely
  const envOwnerRaw = ((import.meta as any).env?.VITE_CONTRACT_OWNER_ADDRESS ?? '') as string;
  const envOwner = envOwnerRaw ? String(envOwnerRaw).toLowerCase() : '';

  useEffect(() => {
    if (account) {
      checkAdminStatus();
      checkAccountBalance();
    }
  }, [account]);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      const contract = await getContract();

      let ownerRaw: unknown = null;
      let counterRaw: unknown = 0;

      try {
        ownerRaw = await contract.owner();
      } catch (e) {
        ownerRaw = envOwnerRaw;
      }

      try {
        counterRaw = await contract.certificateCounter();
      } catch (e) {
        counterRaw = 0;
      }

      const ownerStr = ownerRaw ? String(ownerRaw).toLowerCase() : envOwner;

      setOwnerAddress(ownerStr);
      setTotalCertificates(Number(counterRaw ?? 0));
      setIsOwner(account?.toLowerCase() === ownerStr);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setOwnerAddress(envOwner);
      setIsOwner(account?.toLowerCase() === envOwner);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccountBalance = async () => {
    try {
      const contract = await getContract();
      const provider = contract.runner?.provider;
      if (provider && account) {
        const balance = await provider.getBalance(account);
        // Convertir wei en ETH
        const ethBalance = (Number(balance) / 1e18).toFixed(4);
        setAccountBalance(ethBalance);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingInstitution(true);
    setAddInstitutionError('');
    setAddInstitutionSuccess(false);

    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      if (!isOwner) {
        throw new Error('Only contract owner can add institutions');
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(institutionAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Vérifier le solde avant la transaction
      if (parseFloat(accountBalance) < 0.001) {
        throw new Error('Insufficient ETH balance. You need ETH to pay for gas fees.');
      }

      const contract = await getContract();
      
      console.log('Adding institution:', institutionAddress);
      
      // Utiliser estimateGas pour obtenir une estimation précise
      let gasLimit;
      try {
        gasLimit = await contract.addInstitution.estimateGas(institutionAddress);
        console.log('Estimated gas:', gasLimit.toString());
      } catch (estimateError) {
        console.warn('Gas estimation failed, using default:', estimateError);
        gasLimit = 100000n; // Fallback value
      }

      const tx = await contract.addInstitution(institutionAddress, {
        gasLimit: gasLimit
      });
      
      console.log('Transaction sent:', tx);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setAddInstitutionSuccess(true);
      setInstitutionAddress('');
      
      // Mettre à jour le solde après la transaction
      await checkAccountBalance();
      
      setTimeout(() => setAddInstitutionSuccess(false), 5000);

    } catch (err: any) {
      console.error('Error adding institution:', err);
      
      if (err.message.includes('user rejected transaction')) {
        setAddInstitutionError('Transaction was rejected by user');
      } else if (err.message.includes('insufficient funds')) {
        setAddInstitutionError('Insufficient ETH for gas fees. Please add ETH to your account.');
      } else if (err.message.includes('execution reverted')) {
        const revertMatch = err.message.match(/execution reverted: (.+?)(?="|$)/);
        setAddInstitutionError(revertMatch ? revertMatch[1] : 'Transaction failed - contract reverted');
      } else if (err.message.includes('gas')) {
        setAddInstitutionError('Gas estimation failed. Please check your network connection.');
      } else {
        setAddInstitutionError(err.message || 'Failed to add institution');
      }
    } finally {
      setIsAddingInstitution(false);
    }
  };

  if (!account) {
    return (
      <div className="card-premium bg-gradient-to-r from-orange-50 to-red-50 p-8 border-l-4 border-orange-500 fade-in">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <p className="text-orange-900 font-medium">Connect your wallet to view admin information</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-premium p-12 flex flex-col items-center justify-center fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading admin information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Admin Status Banner */}
      {!isOwner && (
        <div className="card-premium bg-gradient-to-r from-red-50 to-orange-50 p-6 border-l-4 border-red-500">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Not Authorized</h3>
              <p className="text-red-800 text-sm mb-3">
                Only the contract owner can perform administrative actions. You are viewing this dashboard in read-only mode.
              </p>
              <p className="text-red-700 text-xs font-mono bg-red-100 px-3 py-2 rounded-lg break-all">
                Contract Owner: {shortenAddress(ownerAddress)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="card-premium bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900">Administrator Access</h3>
              <p className="text-green-700 text-sm">You have full authority to manage institutions and oversee the system</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Balance Warning */}
      {isOwner && parseFloat(accountBalance) < 0.01 && (
        <div className="card-premium bg-gradient-to-r from-yellow-50 to-amber-50 p-6 border-l-4 border-yellow-500">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Low ETH Balance</h3>
              <p className="text-yellow-800 text-sm mb-3">
                Your account has {accountBalance} ETH. You need ETH to pay for transaction gas fees.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Coins className="w-4 h-4" />
                <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  Balance: {accountBalance} ETH
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-premium bg-gradient-to-br from-blue-50 to-blue-100 border-t-4 border-blue-500 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-blue-700 text-xs">
                <Coins className="w-3 h-3" />
                <span>{accountBalance} ETH</span>
              </div>
            </div>
          </div>
          <p className="text-blue-700 text-sm font-semibold uppercase tracking-wider mb-2">Total Certificates</p>
          <p className="text-5xl font-bold text-blue-900">{totalCertificates}</p>
          <p className="text-blue-600 text-xs mt-3 font-medium">
            {totalCertificates === 1 ? '1 certificate issued' : `${totalCertificates} certificates issued`}
          </p>
        </div>

        <div className="card-premium bg-gradient-to-br from-green-50 to-emerald-100 border-t-4 border-green-500 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-green-700 text-sm font-semibold uppercase tracking-wider mb-2">Active Institutions</p>
          <p className="text-5xl font-bold text-green-900">-</p>
          <p className="text-green-600 text-xs mt-3 font-medium">Coming soon</p>
        </div>

        <div className="card-premium bg-gradient-to-br from-orange-50 to-amber-100 border-t-4 border-orange-500 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-orange-700 text-sm font-semibold uppercase tracking-wider mb-2">This Month</p>
          <p className="text-5xl font-bold text-orange-900">-</p>
          <p className="text-orange-600 text-xs mt-3 font-medium">Coming soon</p>
        </div>
      </div>

      {/* Add Institution Section - Only for Owner */}
      {isOwner && (
        <div className="card-premium p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <Building2 className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Manage Institutions</h3>
              <p className="text-gray-600">Add authorized institutions to issue certificates</p>
            </div>
          </div>

          <form onSubmit={handleAddInstitution} className="space-y-6">
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
                  disabled={isAddingInstitution || !institutionAddress || parseFloat(accountBalance) < 0.001}
                  className="btn-primary bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingInstitution ? (
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

          {addInstitutionSuccess && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl animate-fadeIn">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-2">Institution Added Successfully</h3>
                  <p className="text-green-700 text-sm">
                    The institution has been authorized to issue certificates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {addInstitutionError && (
            <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl animate-fadeIn">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800 text-sm">{addInstitutionError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
      )}

      {/* Contract Details */}
      <div className="card-premium p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
          <Shield className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-bold text-gray-800">Contract Details</h3>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Contract Owner</p>
              <p className="font-mono text-sm text-gray-900 break-all font-semibold">{shortenAddress(ownerAddress)}</p>
              <p className="text-xs text-blue-600 mt-2 font-mono">{ownerAddress}</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">Your Address</p>
              <p className="font-mono text-sm text-gray-900 break-all font-semibold">{shortenAddress(account)}</p>
              <p className="text-xs text-indigo-600 mt-2 font-mono">{account}</p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">Certificate Counter</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-4xl font-bold text-purple-900">{totalCertificates}</p>
                <p className="text-xs text-purple-600 mt-1">certificates on record</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Blockchain Security</p>
            <p className="text-blue-700">All issued certificates are permanently stored on the blockchain and cannot be modified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}