
import { useState, useEffect } from 'react';
import { Award, Home, ShieldCheck, FileCheck, GraduationCap, Sparkles, Building2 } from 'lucide-react';
import WalletConnect from './components/WalletConnect';
import IssueCertificate from './components/IssueCertificate';
import VerifyCertificate from './components/VerifyCertificate';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import InstitutionDashboard from './components/InstitutionDashboard';
import { getContract } from './utils/web3';

type View = 'home' | 'issue' | 'verify' | 'dashboard' | 'admin' | 'institution';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState<boolean>(false);
  const [isCheckingInstitution, setIsCheckingInstitution] = useState(false);

  // Read Vite env for contract owner
  const envOwner = ((import.meta as any).env?.VITE_CONTRACT_OWNER_ADDRESS ?? '') as string;

  const handleAccountChange = (newAccount: string | null) => {
    setAccount(newAccount);
    if (!newAccount) {
      setCurrentView('home');
      setIsOwner(false);
      setIsInstitution(false);
    }
  };

  // Check if connected account is the contract owner and institution status
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!account) {
        setIsOwner(false);
        setIsInstitution(false);
        return;
      }

      setIsCheckingAdmin(true);
      setIsCheckingInstitution(true);
      
      try {
        const contract = await getContract();
        let ownerRaw: unknown = null;
        
        try {
          ownerRaw = await contract.owner();
        } catch (e) {
          ownerRaw = envOwner;
        }

        const ownerStr = ownerRaw ? String(ownerRaw).toLowerCase() : envOwner.toLowerCase();
        setIsOwner(account.toLowerCase() === ownerStr);

        // Check institution status
        try {
          const institutionStatus = await contract.isInstitution(account);
          setIsInstitution(institutionStatus);
        } catch (err) {
          console.error('Error checking institution status:', err);
          setIsInstitution(false);
        }
      } catch (err) {
        console.error('Error checking account status:', err);
        setIsOwner(account.toLowerCase() === envOwner.toLowerCase());
        setIsInstitution(false);
      } finally {
        setIsCheckingAdmin(false);
        setIsCheckingInstitution(false);
      }
    };

    checkAccountStatus();
  }, [account, envOwner]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              onClick={() => setCurrentView('home')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">EduCert</h1>
                <p className="text-xs text-gray-500 font-medium">Blockchain Certification</p>
              </div>
            </div>
            <WalletConnect onAccountChange={handleAccountChange} />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-72 flex-shrink-0">
            <div className="card-premium p-6 sticky top-24 shadow-premium">
              <nav className="space-y-2">
                <button
                  onClick={() => setCurrentView('home')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                    currentView === 'home'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-md border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>

                <div className="h-px bg-gray-200 my-2"></div>

                <button
                  onClick={() => setCurrentView('verify')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                    currentView === 'verify'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 shadow-md border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <FileCheck className="w-5 h-5" />
                  <span>Verify Certificate</span>
                </button>

                {account && (
                  <>
                    <div className="h-px bg-gray-200 my-2"></div>

                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                      Connected
                    </p>

                    {/* My Certificates - Pour tous les utilisateurs */}
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                        currentView === 'dashboard'
                          ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 shadow-md border border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                      <span>My Certificates</span>
                    </button>

                    {/* Issue Certificate - Seulement pour les institutions */}
                    {isInstitution && (
                      <button
                        onClick={() => setCurrentView('issue')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                          currentView === 'issue'
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-100 text-blue-700 shadow-md border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                        <span>Issue Certificate</span>
                        {isCheckingInstitution && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-auto"></div>
                        )}
                      </button>
                    )}

                    {/* Institution Dashboard - Seulement pour les institutions */}
                    {isInstitution && (
                      <button
                        onClick={() => setCurrentView('institution')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                          currentView === 'institution'
                            ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 shadow-md border border-purple-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span>Institution Dashboard</span>
                        {isCheckingInstitution && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse ml-auto"></div>
                        )}
                      </button>
                    )}

                    {/* Only show Admin Dashboard for contract owner */}
                    {isOwner && (
                      <button
                        onClick={() => setCurrentView('admin')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                          currentView === 'admin'
                            ? 'bg-gradient-to-r from-orange-50 to-amber-100 text-orange-700 shadow-md border border-orange-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span>Admin Dashboard</span>
                        {isCheckingAdmin && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse ml-auto"></div>
                        )}
                      </button>
                    )}
                  </>
                )}
              </nav>

              {/* Status badges in sidebar */}
              <div className="mt-6 space-y-2">
                {isOwner && (
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">Contract Owner</span>
                    </div>
                  </div>
                )}
                
                {isInstitution && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Authorized Institution</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {currentView === 'home' && (
              <div className="space-y-8">
                <div className="card-premium p-10 shadow-premium fade-in">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome to EduCert</h2>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        A decentralized certification platform powered by blockchain technology. Issue, verify, and manage educational certificates with complete transparency and security.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mt-10">
                    <div className="card bg-gradient-to-br from-blue-50 via-white to-blue-50 p-7 border-l-4 border-blue-500 hover:shadow-lg">
                      <div className="p-3 bg-blue-600 rounded-xl w-fit mb-4">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">Issue Certificates</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Educational institutions can issue tamper-proof digital certificates directly on the blockchain with full transparency.
                      </p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-50 via-white to-emerald-50 p-7 border-l-4 border-green-500 hover:shadow-lg">
                      <div className="p-3 bg-green-600 rounded-xl w-fit mb-4">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">Verify Instantly</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Anyone can verify the authenticity of a certificate in seconds using just the certificate ID.
                      </p>
                    </div>

                    <div className="card bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-7 border-l-4 border-indigo-500 hover:shadow-lg">
                      <div className="p-3 bg-indigo-600 rounded-xl w-fit mb-4">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">Manage Portfolio</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Students can view and manage all their certificates in one secure blockchain-backed dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Role-based features highlight */}
                  <div className="mt-8 grid md:grid-cols-2 gap-6">
                    {isOwner && (
                      <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <ShieldCheck className="w-6 h-6 text-orange-600" />
                          <h3 className="font-bold text-orange-900 text-lg">Administrator Access</h3>
                        </div>
                        <p className="text-orange-800 text-sm">
                          As the contract owner, you have access to the Admin Dashboard where you can manage institutions and view system statistics.
                        </p>
                      </div>
                    )}
                    
                    {isInstitution && (
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <Building2 className="w-6 h-6 text-purple-600" />
                          <h3 className="font-bold text-purple-900 text-lg">Institution Access</h3>
                        </div>
                        <p className="text-purple-800 text-sm">
                          As an authorized institution, you can issue certificates and manage your issued certificates in the Institution Dashboard.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-premium bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-l-4 border-blue-500 shadow-premium fade-in">
                  <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Getting Started
                  </h3>
                  <ol className="list-decimal list-inside space-y-3 text-blue-900 text-sm font-medium">
                    <li>Connect your MetaMask wallet using the button in the top right corner</li>
                    <li>Ensure you are connected to your local Ganache network (typically localhost:8545)</li>
                    <li>Use the sidebar navigation to access different features</li>
                    <li>Students can view their certificates, institutions can issue and manage certificates</li>
                    {isOwner && (
                      <li className="font-semibold text-orange-700">
                        You are the contract owner - access the Admin Dashboard to manage institutions
                      </li>
                    )}
                    {isInstitution && (
                      <li className="font-semibold text-purple-700">
                        You are an authorized institution - you can issue certificates and manage them
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {currentView === 'issue' && <IssueCertificate account={account} />}
            {currentView === 'verify' && <VerifyCertificate />}
            {currentView === 'dashboard' && <UserDashboard account={account} />}
            {currentView === 'admin' && <AdminDashboard account={account} />}
            {currentView === 'institution' && <InstitutionDashboard account={account} />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;