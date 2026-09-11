/**
 * Thin wrapper around the Contact Picker API (`navigator.contacts.select`).
 * Support is limited to Chrome/Edge on Android — no iOS Safari, no desktop —
 * so every caller must feature-detect with `isContactPickerSupported()`
 * before showing an "importer un contact" button.
 * https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API
 */

export interface PickedContact {
  name: string;
  phone: string;
}

interface ContactsManager {
  select: (
    properties: string[],
    options?: { multiple?: boolean }
  ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
}

function getContactsManager(): ContactsManager | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { contacts?: ContactsManager };
  return 'contacts' in navigator && nav.contacts ? nav.contacts : null;
}

export function isContactPickerSupported(): boolean {
  return getContactsManager() !== null;
}

/** Opens the native contact picker. Returns [] if the user cancels. */
export async function pickContacts(multiple: boolean): Promise<PickedContact[]> {
  const manager = getContactsManager();
  if (!manager) return [];

  try {
    const picked = await manager.select(['name', 'tel'], { multiple });
    return picked
      .map((c) => ({
        name: c.name?.[0]?.trim() ?? '',
        phone: c.tel?.[0]?.replace(/[^\d+]/g, '') ?? '',
      }))
      .filter((c) => c.name && c.phone);
  } catch {
    // User cancelled, or permission denied — treat the same as "nothing picked".
    return [];
  }
}
