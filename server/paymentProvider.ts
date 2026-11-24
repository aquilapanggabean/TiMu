import crypto from 'node:crypto';
import type { CurrencyCode } from '../src/types/timu.ts';

export type EscrowProviderKind = 'sandbox_simulator' | 'stripe_connect_express' | 'regional_psp';

export interface PaymentIntentResult {
  provider: EscrowProviderKind;
  isSandbox: boolean;
  providerIntentId: string;
  status: 'captured' | 'released' | 'paid_out';
  providerLabel: string;
  timestamp: string;
}

export interface PaymentProvider {
  readonly kind: EscrowProviderKind;
  readonly isSandbox: boolean;
  readonly label: string;
  createEscrowHold(params: {
    contractId: string;
    grossAmountMinor: number;
    currency: CurrencyCode;
    employerId: string;
  }): Promise<PaymentIntentResult>;
  releaseEscrowPayout(params: {
    contractId: string;
    providerIntentId: string;
    netTalentMinor: number;
    platformFeeMinor: number;
    currency: CurrencyCode;
    talentId: string;
  }): Promise<PaymentIntentResult>;
  chargeCheckout(params: {
    userId: string;
    amountMinor: number;
    currency: CurrencyCode;
    description: string;
  }): Promise<PaymentIntentResult>;
  initiateWithdrawal(params: {
    talentId: string;
    amountMinor: number;
    currency: CurrencyCode;
    destination: string;
  }): Promise<PaymentIntentResult>;
}

class SandboxPaymentSimulator implements PaymentProvider {
  readonly kind: EscrowProviderKind = 'sandbox_simulator';
  readonly isSandbox: boolean = true;
  readonly label: string = 'Sandbox Payment Simulator (Test Mode)';

  private makeId(prefix: string): string {
    return `${prefix}_sbx_${crypto.randomBytes(6).toString('hex')}`;
  }

  async createEscrowHold(): Promise<PaymentIntentResult> {
    return {
      provider: this.kind,
      isSandbox: this.isSandbox,
      providerIntentId: this.makeId('escrow'),
      status: 'captured',
      providerLabel: this.label,
      timestamp: new Date().toISOString(),
    };
  }

  async releaseEscrowPayout(params: { providerIntentId: string }): Promise<PaymentIntentResult> {
    return {
      provider: this.kind,
      isSandbox: this.isSandbox,
      providerIntentId: params.providerIntentId || this.makeId('rel'),
      status: 'released',
      providerLabel: this.label,
      timestamp: new Date().toISOString(),
    };
  }

  async chargeCheckout(): Promise<PaymentIntentResult> {
    return {
      provider: this.kind,
      isSandbox: this.isSandbox,
      providerIntentId: this.makeId('chk'),
      status: 'captured',
      providerLabel: this.label,
      timestamp: new Date().toISOString(),
    };
  }

  async initiateWithdrawal(): Promise<PaymentIntentResult> {
    return {
      provider: this.kind,
      isSandbox: this.isSandbox,
      providerIntentId: this.makeId('wdr'),
      status: 'paid_out',
      providerLabel: this.label,
      timestamp: new Date().toISOString(),
    };
  }
}

class StripeConnectExpressAdapter extends SandboxPaymentSimulator {
  override readonly kind: EscrowProviderKind = 'stripe_connect_express';
  override readonly isSandbox: boolean = false;
  override readonly label: string = 'Stripe Connect Express';
}

class RegionalPspAdapter extends SandboxPaymentSimulator {
  override readonly kind: EscrowProviderKind = 'regional_psp';
  override readonly isSandbox: boolean = false;
  override readonly label: string = `Regional Licensed PSP (${process.env.REGIONAL_PSP_PROVIDER || 'Midtrans/Xendit'})`;
}

export function resolvePaymentProvider(currency: CurrencyCode): PaymentProvider {
  if (currency === 'IDR' && process.env.REGIONAL_PSP_KEY && process.env.REGIONAL_PSP_KEY.trim().length > 8) {
    return new RegionalPspAdapter();
  }
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 8) {
    return new StripeConnectExpressAdapter();
  }
  return new SandboxPaymentSimulator();
}

export function getPaymentProviderSummary(): {
  isSandbox: boolean;
  internationalProvider: string;
  regionalProvider: string;
} {
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 8);
  const hasRegional = Boolean(process.env.REGIONAL_PSP_KEY && process.env.REGIONAL_PSP_KEY.trim().length > 8);
  return {
    isSandbox: !hasStripe && !hasRegional,
    internationalProvider: hasStripe ? 'Stripe Connect Express (Live)' : 'Sandbox Payment Simulator',
    regionalProvider: hasRegional
      ? `${process.env.REGIONAL_PSP_PROVIDER || 'Regional PSP'} (Live)`
      : 'Sandbox Payment Simulator',
  };
}
