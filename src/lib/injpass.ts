/**
 * INJ Pass cross-origin wallet connector.
 *
 * Opens an INJ Pass popup, waits for authentication, then routes
 * transaction-sign requests through the popup via postMessage.
 *
 * Protocol:
 *   popup → opener : { type: 'INJPASS_CONNECTED', address }
 *   opener → popup : { type: 'INJPASS_SIGN_TX', id, to, value }
 *   popup → opener : { type: 'INJPASS_TX_RESULT', id, txHash?, error? }
 */

const INJPASS_ORIGIN = 'https://inj-pass-frontend-nfc.vercel.app';
const POPUP_W = 420;
const POPUP_H = 660;
const TX_TIMEOUT_MS = 120_000;

let popup: Window | null = null;
const pending = new Map<string, { resolve: (h: string) => void; reject: (e: Error) => void }>();

function popupOptions() {
  const left = Math.round(window.screenX + (window.outerWidth  - POPUP_W) / 2);
  const top  = Math.round(window.screenY + (window.outerHeight - POPUP_H) / 2);
  return `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

/** Open the INJ Pass popup and wait for the user to authenticate. Returns the wallet address. */
export function openInjPassPopup(): Promise<string> {
  return new Promise((resolve, reject) => {
    const connectUrl =
      `${INJPASS_ORIGIN}/connect?origin=${encodeURIComponent(window.location.origin)}`;

    popup = window.open(connectUrl, 'injpass_popup', popupOptions());

    if (!popup) {
      reject(new Error('Popup blocked — please allow popups for this site and try again.'));
      return;
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== INJPASS_ORIGIN) return;

      if (e.data?.type === 'INJPASS_CONNECTED') {
        window.removeEventListener('message', onMessage);
        clearInterval(closedCheck);
        resolve(e.data.address as string);
      }

      if (e.data?.type === 'INJPASS_TX_RESULT') {
        const req = pending.get(e.data.id);
        if (req) {
          pending.delete(e.data.id);
          if (e.data.error) req.reject(new Error(e.data.error));
          else req.resolve(e.data.txHash as string);
        }
      }
    };

    window.addEventListener('message', onMessage);

    // Detect popup closed before auth completes
    const closedCheck = setInterval(() => {
      if (popup?.closed) {
        clearInterval(closedCheck);
        window.removeEventListener('message', onMessage);
        reject(new Error('INJ Pass window was closed before connecting'));
      }
    }, 500);
  });
}

/**
 * Send a transaction via the INJ Pass popup.
 * @param to      Destination address
 * @param value   Amount in INJ as a decimal string, e.g. "0.000001"
 */
export function signTxViaInjPass(to: string, value: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!popup || popup.closed) {
      reject(new Error('INJ Pass is not connected'));
      return;
    }

    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { resolve, reject });

    popup.postMessage({ type: 'INJPASS_SIGN_TX', id, to, value }, INJPASS_ORIGIN);

    // Also register a global listener if not already active
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== INJPASS_ORIGIN) return;
      if (e.data?.type !== 'INJPASS_TX_RESULT' || e.data.id !== id) return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      const req = pending.get(id);
      if (req) {
        pending.delete(id);
        if (e.data.error) req.reject(new Error(e.data.error));
        else req.resolve(e.data.txHash as string);
      }
    };
    window.addEventListener('message', onMessage);

    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('Transaction signing timed out'));
      }
    }, TX_TIMEOUT_MS);
  });
}

/** Disconnect: close the popup and clear state. */
export function disconnectInjPass() {
  if (popup && !popup.closed) popup.close();
  popup = null;
  pending.forEach((r) => r.reject(new Error('Disconnected')));
  pending.clear();
}

/** Returns true when the popup is open and connected. */
export function isInjPassConnected() {
  return !!popup && !popup.closed;
}
