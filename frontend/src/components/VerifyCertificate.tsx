import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2, Shield, Award, Calendar, User, Building, BookOpen } from 'lucide-react';
import { getContract, formatDate, shortenAddress } from '../utils/web3';
import type { Certificate } from '../utils/web3';

export default function VerifyCertificate() {
  const [certificateId, setCertificateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [recentCertificates, setRecentCertificates] = useState<Array<{ id: string; txHash?: string }>>([]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setCertificate(null);
    setIsValid(null);

    try {
      const contract = await getContract();

      // contract.verifyCertificate returns (valid, institution, student, studentName, degree, issuedDate)
      const result = await contract.verifyCertificate(Number(certificateId));
      // result may be an array-like or an object depending on ethers version
      const valid = result[0] as boolean;
      setIsValid(Boolean(valid));

      if (valid) {
        const institution = String(result[1]);
        const student = String(result[2]);
        const studentName = String(result[3]);
        const degree = String(result[4]);
        const issuedDate = String(result[5]);

        setCertificate({
          recipient: student,
          courseName: degree,
          institutionName: institution,
          studentName: studentName,
          issuedDate: BigInt(Math.floor(new Date(issuedDate).getTime() / 1000)),
          isValid: true,
        });
      }
    } catch (err: any) {
      // Better error messages for common issues (ABI mismatch / contract not deployed / network mismatch)
      const msg = err?.message || String(err);
      if (msg.includes('could not decode result data') || msg.includes('BAD_DATA') || msg.includes('missing revert data')) {
        // Try to provide useful fallback: list recent CertificateIssued events (id + txHash)
        try {
          const contract = await getContract();
          // query recent CertificateIssued events
          const events = await contract.queryFilter(contract.filters?.CertificateIssued?.() ?? []);
          const list = events.map((ev: any) => {
            try {
              const parsed: any = contract.interface.parseLog(ev);
              if (parsed && parsed.args && parsed.args[0] != null) {
                return { id: String(parsed.args[0]), txHash: ev.transactionHash };
              }
            } catch {
              /* ignore parse error */
            }
            // fallback: try to read ev.args
            try {
              if (ev.args && ev.args[0] != null) return { id: String(ev.args[0]), txHash: ev.transactionHash };
            } catch {}
            return { id: 'unknown', txHash: ev.transactionHash };
          });
          if (list.length) {
            setRecentCertificates(list);
            setError('Impossible de décoder la réponse — voici les certificats récemment émis (IDs et tx hashes).');
          } else {
            setError('Contract call failed: check that the contract is deployed at the address in `.env` and that MetaMask is connected to the same Ganache network. No recent CertificateIssued events found.');
          }
        } catch (e: any) {
          setError('Contract call failed: check that the contract is deployed at the address in `.env` and that MetaMask is connected to the same Ganache network. Additionally, fetching past events failed.');
        }
      } else if (msg.includes('No contract code found') || msg.includes('Invalid CONTRACT_ADDRESS')) {
        setError(msg);
      } else {
        setError(msg || 'Failed to verify certificate');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-premium p-8 fade-in">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl">
          <Search className="w-7 h-7 text-green-700" />
        </div>
        <div>
          <h2 className="section-title">Verify Certificate</h2>
          <p className="section-subtitle">Check certificate authenticity on the blockchain</p>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Certificate ID
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              required
              min="0"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter certificate ID to verify"
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={isLoading || !certificateId}
              className="btn-primary bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl animate-fadeIn">
          <div className="flex items-start gap-4">
            <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Verification Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
              {recentCertificates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Recent issued certificates (ID — txHash):</p>
                  <ul className="text-xs font-mono text-gray-800 space-y-2">
                    {recentCertificates.map((c) => (
                      <li key={c.id} className="break-all">{c.id} — {c.txHash ?? 'no-tx'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isValid !== null && (
        <div className="mt-8 animate-fadeIn">
          {isValid ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Award className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Certificate of Completion</h1>
                <p className="opacity-90 mb-4">Digitally verified on the blockchain</p>
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified and permanently recorded on the blockchain
                </div>
              </div>

              {/* Certificate Body */}
              <div className="p-8">
                {certificate && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Student Name</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{certificate.studentName}</p>
                        </div>

                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Course</p>
                          </div>
                          <p className="text-xl font-semibold text-gray-800">{certificate.courseName}</p>
                        </div>

                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Issued Date</p>
                          </div>
                          <p className="text-lg font-medium text-gray-800">{formatDate(certificate.issuedDate)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Institution</p>
                          </div>
                          <p className="text-xl font-semibold text-gray-800">{certificate.institutionName}</p>
                        </div>

                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            </div>
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Recipient Address</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="font-mono text-gray-900 text-sm break-all">{certificate.recipient}</p>
                          </div>
                        </div>

                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            </div>
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Certificate ID</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="font-mono text-gray-900 font-bold">{certificateId}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900">Blockchain Verified</p>
                            <p className="text-sm text-gray-600">This certificate is immutable and tamper-proof</p>
                          </div>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Verification Status</p>
                          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            VERIFIED AND VALID
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <XCircle className="w-9 h-9 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-red-900 mb-2">Certificate Not Found</h3>
                  <p className="text-red-800">The certificate ID does not exist on the blockchain. Please check the ID and try again.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Blockchain Security</p>
          <p className="text-blue-700">All certificate data is stored immutably on the blockchain and cannot be altered or forged.</p>
        </div>
      </div>
    </div>
  );
}