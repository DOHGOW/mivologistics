/**
 * Client-side checkout for Paystack + Flutterwave inline popups.
 * Both providers ship a script that attaches a global constructor —
 * we lazy-load each script once, then call it the way their docs specify.
 * Real charge verification MUST also happen server-side (Cloud Function)
 * before you trust `status: 'paid'` for anything money-related; the
 * verifyOnClient() call here is a convenience check only, see README.
 */

declare global {
  interface Window {
    PaystackPop?: { setup: (opts: Record<string, unknown>) => { openIframe: () => void } };
    FlutterwaveCheckout?: (opts: Record<string, unknown>) => void;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export interface CheckoutParams {
  email: string;
  amountNaira: number;
  reference: string;
  name?: string;
  phone?: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export async function payWithPaystack(params: CheckoutParams) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) throw new Error('Missing VITE_PAYSTACK_PUBLIC_KEY — add it to your .env file.');

  await loadScript('https://js.paystack.co/v1/inline.js');
  if (!window.PaystackPop) throw new Error('Paystack script failed to load.');

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: params.email,
    amount: Math.round(params.amountNaira * 100), // kobo
    ref: params.reference,
    currency: 'NGN',
    callback: (response: { reference: string }) => params.onSuccess(response.reference),
    onClose: params.onClose,
  });
  handler.openIframe();
}

export async function payWithFlutterwave(params: CheckoutParams) {
  const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  if (!publicKey) throw new Error('Missing VITE_FLUTTERWAVE_PUBLIC_KEY — add it to your .env file.');

  await loadScript('https://checkout.flutterwave.com/v3.js');
  if (!window.FlutterwaveCheckout) throw new Error('Flutterwave script failed to load.');

  window.FlutterwaveCheckout({
    public_key: publicKey,
    tx_ref: params.reference,
    amount: params.amountNaira,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: { email: params.email, phone_number: params.phone, name: params.name },
    customizations: {
      title: 'Mivo Logistics',
      description: 'Truck booking payment',
      logo: '',
    },
    callback: (response: { status: string; transaction_id: string }) => {
      if (response.status === 'successful' || response.status === 'completed') {
        params.onSuccess(String(response.transaction_id));
      }
    },
    onclose: params.onClose,
  });
}
