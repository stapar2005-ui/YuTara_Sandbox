"use client";

import { useEffect, useState } from "react";
import { User, Settings } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { readProfile, UserProfile, writeProfile } from "@/lib/profile";

export default function ProfilePage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileDraft, setProfileDraft] = useState<UserProfile>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<"profile" | "preferences">("profile");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      if (current?.email) {
        const prof = await readProfile(current.email);
        setProfile(prof);
        setProfileDraft({ ...prof });
      }
      setLoaded(true);
    };
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Profile & Settings</div>
            <h1 className="display">Profile & Settings</h1>
            <div className="empty-state">
              <span className="spinner" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Profile & Settings</div>
            <h1 className="display">Profile & Settings</h1>
            <div className="empty-state">
              <User size={48} />
              <h3>Please sign in to view your profile.</h3>
              <p>Sign in to manage your account settings.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      await writeProfile(session.email, profileDraft);
      setProfile({ ...profileDraft });
      setSaveMessage("Profile changes saved.");
    } catch {
      setSaveMessage("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="Profile & Settings"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Profile & Settings</div>
              <h1>Profile & Settings</h1>
              <p>
                Manage your personal information and account preferences.
              </p>
            </div>
          </div>

          <div className="profile-settings-grid">
            <div className="settings-nav">
              <div className="settings-section">
                <h2>Account</h2>
                <button
                  type="button"
                  className={`settings-item ${activeSettingsSection === "profile" ? "active" : ""}`}
                  aria-pressed={activeSettingsSection === "profile"}
                  onClick={() => {
                    setActiveSettingsSection("profile");
                    document.getElementById("settings-profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  className={`settings-item ${activeSettingsSection === "preferences" ? "active" : ""}`}
                  aria-pressed={activeSettingsSection === "preferences"}
                  onClick={() => {
                    setActiveSettingsSection("preferences");
                    document.getElementById("settings-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Settings size={18} />
                  <span>Account Preferences</span>
                </button>
              </div>
            </div>

            <div className="settings-content">
              <div className="settings-header">
                <div className="profile-avatar-large">
                  {profileDraft.avatar ? (
                    <img src={profileDraft.avatar} alt="Profile" />
                  ) : (
                    <span className="profile-initials">
                      {session.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <h2>{profileDraft.name || session.name}</h2>
                  <p className="muted">{session.email}</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="settings-form">
                <div className="form-section" id="settings-profile" style={{ scrollMarginTop: 100 }}>
                  <h3>Personal Information</h3>
                  <div className="form-field">
                    <label>Display name</label>
                    <input
                      className="input"
                      value={profileDraft.name ?? ""}
                      onChange={(e) =>
                        setProfileDraft((c) => ({ ...c, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Email address</label>
                    <input
                      className="input"
                      value={session.email}
                      readOnly
                    />
                  </div>
                  <div className="form-field">
                    <label>Bio</label>
                    <textarea
                      className="input textarea"
                      value={profileDraft.bio ?? ""}
                      onChange={(e) =>
                        setProfileDraft((c) => ({ ...c, bio: e.target.value }))
                      }
                      placeholder="Tell buyers or sellers a little about yourself."
                    />
                  </div>
                </div>

                <div className="form-section" id="settings-preferences" style={{ scrollMarginTop: 100 }}>
                  <h3>Account Preferences</h3>
                  <div className="settings-row">
                    <div>
                      <strong>Inquiry alerts</strong>
                      <p className="muted">
                        Show a badge when buyers reach out about your listings.
                      </p>
                    </div>
                    <span className="badge badge-green">On</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setProfileDraft({ ...profile })}
                  >
                    Cancel
                  </button>
                </div>
                {saveMessage && (
                  <p className="status-message" role="status" style={{ marginTop: 12 }}>
                    {saveMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
