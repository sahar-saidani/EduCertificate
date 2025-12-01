import { useState, useEffect } from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { connectWallet, shortenAddress } from '../utils/web3';

interface WalletConnectProps {
  onAccountChange: (account: string | null) => void;
}

export default function WalletConnect({ onAccountChange }: WalletConnectProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onAccountChange(accounts[0]);
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      onAccountChange(accounts[0]);
    } else {
      setAccount(null);
      onAccountChange(null);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const address = await connectWallet();
      setAccount(address);
      onAccountChange(address);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    onAccountChange(null);
    setError('');
  };

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md px-4 py-2.5 border border-green-200">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full pulse-dot"></div>
            </div>
            <span className="text-sm font-semibold text-gray-800">{shortenAddress(account)}</span>
          </div>
          <div className="w-px h-5 bg-green-200"></div>
          <button
            onClick={handleDisconnect}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-all duration-300"
            title="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
