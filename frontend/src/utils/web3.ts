import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';



console.log(CONTRACT_ABI)
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface Certificate {
  recipient: string;
  courseName: string;
  institutionName: string;
  studentName: string;
  issuedDate: bigint;
  isValid: boolean;
}

export const connectWallet = async (): Promise<string> => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0];
  } catch (error: any) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
};

export const getContract = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  const { ethers } = await import('ethers');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return contract;
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatDate = (timestamp: bigint): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
