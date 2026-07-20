import { useEffect } from 'react';

interface OTPCredential extends Credential {
  code: string;
}

/**
 * Auto-reads an incoming SMS one-time code via the WebOTP API (Chrome/Android)
 * so the user never has to open Messages and copy it by hand. No-ops on
 * browsers without support (iOS Safari instead relies on
 * `autocomplete="one-time-code"` on the input itself — see CodeInput).
 *
 * The backend's OTP SMS must end with a line binding it to our origin
 * (`@domain #code`) for the browser to recognize it — see auth.service.ts.
 */
export function useWebOtpAutofill(active: boolean, onCode: (code: string) => void) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;

    const controller = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: controller.signal,
      } as CredentialRequestOptions)
      .then((cred) => {
        const code = (cred as OTPCredential | null)?.code;
        if (code) onCode(code);
      })
      .catch(() => {
        // Aborted (component unmounted / step changed) or permission denied — ignore.
      });

    return () => controller.abort();
  }, [active, onCode]);
}
