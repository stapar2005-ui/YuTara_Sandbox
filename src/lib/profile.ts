export type UserProfile = {
  name?: string;
  bio?: string;
  avatar?: string;
};

const PREFIX = "yutara-profile:";
export const PROFILE_EVENT = "yutara-profile-change";

function key(email: string): string {
  return `${PREFIX}${email.toLowerCase()}`;
}

export function readProfile(email: string): UserProfile {
  if (typeof window === "undefined" || !email) return {};
  try {
    const raw = window.localStorage.getItem(key(email));
    return raw ? (JSON.parse(raw) as UserProfile) : {};
  } catch {
    return {};
  }
}

export function writeProfile(email: string, profile: UserProfile): void {
  if (typeof window === "undefined" || !email) return;
  try {
    window.localStorage.setItem(key(email), JSON.stringify(profile));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(PROFILE_EVENT));
}
