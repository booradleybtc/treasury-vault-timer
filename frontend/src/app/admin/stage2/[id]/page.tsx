'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, DollarSign, Users, Wallet, AlertTriangle } from 'lucide-react';

interface VaultConfig {
  id: string;
  name: string;
  description: string;
  meta: any;
  status: string;
  treasuryWallet: string;
  totalVolume: number;
  createdAt: string;
}

interface Stage2FormData {
  tokenAddress: string;
  distributionWallet: string;
  whitelistAddresses: string[];
  vaultLaunchDate: string;
}

export default function Stage2Wizard() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  
  const [vault, setVault] = useState<VaultConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Stage2FormData>({
    tokenAddress: '',
    distributionWallet: '',
    whitelistAddresses: [],
    vaultLaunchDate: ''
  });
  
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com';

  useEffect(() => {
    loadVaultData();
  }, [vaultId]);

  const loadVaultData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vaultId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVault(data.vault);
        
        // Pre-fill form with existing data if available
        if (data.vault.meta?.stage2) {
          setFormData({
            tokenAddress: data.vault.meta.stage2.tokenAddress || '',
            distributionWallet: data.vault.meta.stage2.distributionWallet || '',
            whitelistAddresses: data.vault.meta.stage2.whitelistAddresses || [],
            vaultLaunchDate: data.vault.meta.stage2.vaultLaunchDate || ''
          });
        }
      } else {
        setError('Failed to load vault data');
      }
    } catch (error) {
      console.error('Failed to load vault data:', error);
      setError('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  const addWhitelistAddress = () => {
    if (newWhitelistAddress.trim() && !formData.whitelistAddresses.includes(newWhitelistAddress.trim())) {
      setFormData(prev => ({
        ...prev,
        whitelistAddresses: [...prev.whitelistAddresses, newWhitelistAddress.trim()]
      }));
      setNewWhitelistAddress('');
    }
  };

  const removeWhitelistAddress = (address: string) => {
    setFormData(prev => ({
      ...prev,
      whitelistAddresses: prev.whitelistAddresses.filter(addr => addr !== address)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vaultId}/stage2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to complete Stage 2 setup');
      }
    } catch (error) {
      console.error('Failed to submit Stage 2 data:', error);
      setError('Failed to submit Stage 2 data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading vault data...</div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Vault not found</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Stage 2 Complete!</h2>
              <p className="text-gray-300 mb-4">
                {vault.name} is now ready to launch as a live vault.
              </p>
              <p className="text-sm text-gray-400">
                Redirecting to admin dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="mb-4 text-white border-white/20 hover:bg-white/10"
          >
            ← Back to Admin
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Stage 2 Setup Required
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              ICO Successful: ${vault.totalVolume.toLocaleString()} Raised
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Complete Stage 2 Setup
          </h1>
          <p className="text-gray-300 text-lg">
            Configure token monitoring and launch parameters for <span className="text-purple-400 font-semibold">{vault.name}</span>
          </p>
        </div>

        {/* Vault Summary */}
        <Card className="mb-8 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Vault Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-400">Vault Name</Label>
                <p className="text-white font-semibold">{vault.name}</p>
              </div>
              <div>
                <Label className="text-gray-400">Treasury Wallet</Label>
                <p className="text-white font-mono text-sm">{vault.treasuryWallet}</p>
              </div>
              <div>
                <Label className="text-gray-400">ICO Raised</Label>
                <p className="text-green-400 font-semibold">${vault.totalVolume.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage 2 Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-400" />
                Token & Distribution Setup
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure the minted token and distribution parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Address */}
              <div>
                <Label htmlFor="tokenAddress" className="text-white">
                  Token Address *
                </Label>
                <Input
                  id="tokenAddress"
                  type="text"
                  value={formData.tokenAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
                  placeholder="Enter the minted token address from RevShare"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  The SPL token address that was minted on RevShare
                </p>
              </div>

              {/* Distribution Wallet */}
              <div>
                <Label htmlFor="distributionWallet" className="text-white">
                  Distribution Wallet *
                </Label>
                <Input
                  id="distributionWallet"
                  type="text"
                  value={formData.distributionWallet}
                  onChange={(e) => setFormData(prev => ({ ...prev, distributionWallet: e.target.value }))}
                  placeholder="Enter the distribution wallet address"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  Wallet that will receive and distribute the vault tokens
                </p>
              </div>

              {/* Vault Launch Date */}
              <div>
                <Label htmlFor="vaultLaunchDate" className="text-white">
                  Vault Launch Date *
                </Label>
                <Input
                  id="vaultLaunchDate"
                  type="datetime-local"
                  value={formData.vaultLaunchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vaultLaunchDate: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  When the vault should go live and start monitoring
                </p>
              </div>

              {/* Whitelist Addresses */}
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Whitelist Addresses (Excluded from Buys)
                </Label>
                <p className="text-sm text-gray-400 mb-3">
                  Add addresses that should be excluded from purchasing (e.g., bots, team wallets)
                </p>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    type="text"
                    value={newWhitelistAddress}
                    onChange={(e) => setNewWhitelistAddress(e.target.value)}
                    placeholder="Enter wallet address to exclude"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWhitelistAddress())}
                  />
                  <Button 
                    type="button" 
                    onClick={addWhitelistAddress}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Add
                  </Button>
                </div>

                {formData.whitelistAddresses.length > 0 && (
                  <div className="space-y-2">
                    {formData.whitelistAddresses.map((address, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded border border-white/10">
                        <span className="text-white font-mono text-sm">{address}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWhitelistAddress(address)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-400/50 bg-red-400/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                >
                  {submitting ? 'Completing Setup...' : 'Complete Stage 2 Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
