'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, DollarSign, Wallet, AlertTriangle, Clock } from 'lucide-react';

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

interface RefundFormData {
  refundTxSignature: string;
  notes: string;
}

export default function RefundProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  
  const [vault, setVault] = useState<VaultConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<RefundFormData>({
    refundTxSignature: '',
    notes: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vaultId}/process-refund`, {
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
        setError(errorData.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      setError('Failed to process refund');
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
              <h2 className="text-2xl font-bold text-white mb-2">Refund Processed!</h2>
              <p className="text-gray-300 mb-4">
                Refund for {vault.name} has been successfully processed.
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
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Process Refund
          </h1>
          <p className="text-gray-300 text-lg">
            Process refund for <span className="text-red-400 font-semibold">{vault.name}</span>
          </p>
        </div>

        {/* Vault Summary */}
        <Card className="mb-8 bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-400" />
              Refund Summary
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
                <Label className="text-gray-400">Refund Amount</Label>
                <p className="text-red-400 font-semibold text-xl">${(vault.totalVolume || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-red-400" />
                Refund Processing
              </CardTitle>
              <CardDescription className="text-gray-400">
                Record the refund transaction details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Signature */}
              <div>
                <Label htmlFor="refundTxSignature" className="text-white">
                  Refund Transaction Signature *
                </Label>
                <Input
                  id="refundTxSignature"
                  type="text"
                  value={formData.refundTxSignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, refundTxSignature: e.target.value }))}
                  placeholder="Enter the Solana transaction signature for the refund"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  The transaction hash from the refund transaction on Solana
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-white">
                  Refund Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about the refund process..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  rows={4}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Optional notes about the refund process or any special circumstances
                </p>
              </div>

              {/* Warning */}
              <Alert className="border-yellow-400/50 bg-yellow-400/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <strong>Important:</strong> Make sure the refund transaction has been completed on Solana before submitting this form. 
                  This action will mark the vault as refunded and cannot be undone.
                </AlertDescription>
              </Alert>

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
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-2"
                >
                  {submitting ? 'Processing Refund...' : 'Process Refund'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
