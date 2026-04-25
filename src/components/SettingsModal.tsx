import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LifeBuoy, Mail, Upload, X } from "lucide-react";
import { auth } from "../firebase-config";
import { getApiBaseUrl, resolveApiAssetUrl } from "../lib/apiBase";
import { UserSummary } from "../App";
import Avatar from "./Avatar";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selfSummary: UserSummary | null;
  onProfileUpdated: (profile: Pick<UserSummary, "displayName" | "photoURL">) => void;
}

interface SettingsProfileResponse {
  userId: string;
  displayName: string;
  photoURL?: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selfSummary,
  onProfileUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBaseUrl = getApiBaseUrl();
  const [profile, setProfile] = useState<SettingsProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [issueSubject, setIssueSubject] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [issueStatus, setIssueStatus] = useState<string | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const effectiveProfile = profile || {
    userId: selfSummary?.userId || "",
    displayName: selfSummary?.displayName || "User",
    photoURL: selfSummary?.photoURL || null,
  };

  const avatarUrl = useMemo(
    () => resolveApiAssetUrl(effectiveProfile.photoURL),
    [effectiveProfile.photoURL]
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadProfile = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      setLoadingProfile(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/settings/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Could not load settings.");
        }
        const data: SettingsProfileResponse = await response.json();
        setProfile(data);
        onProfileUpdated({
          displayName: data.displayName,
          photoURL: data.photoURL || null,
        });
      } catch (error) {
        console.error("Failed to load settings profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [apiBaseUrl, isOpen, onProfileUpdated]);

  if (!isOpen) return null;

  const postSupportRequest = async (
    endpoint: string,
    body: { subject: string; message: string },
    onSuccess: () => void
  ) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("Authentication missing.");
    }

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Request failed.");
    }

    onSuccess();
    return data;
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setContactStatus(null);
    setIssueStatus(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication missing.");
      }

      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBaseUrl}/api/settings/profile-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Could not update profile photo.");
      }

      const user = data.user as SettingsProfileResponse;
      setProfile(user);
      await auth.currentUser?.reload();
      onProfileUpdated({
        displayName: user.displayName,
        photoURL: user.photoURL || null,
      });
      setContactStatus("Profile picture updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update profile photo.";
      setContactStatus(message);
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleContactSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setContactStatus(null);
    setSubmittingContact(true);

    try {
      const data = await postSupportRequest(
        "/api/settings/contact",
        {
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
        },
        () => {
          setContactSubject("");
          setContactMessage("");
        }
      );
      setContactStatus(data.message || "Your message was sent.");
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleIssueSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIssueStatus(null);
    setSubmittingIssue(true);

    try {
      const data = await postSupportRequest(
        "/api/settings/report-issue",
        {
          subject: issueSubject.trim(),
          message: issueMessage.trim(),
        },
        () => {
          setIssueSubject("");
          setIssueMessage("");
        }
      );
      setIssueStatus(data.message || "Issue report submitted.");
    } catch (error) {
      setIssueStatus(error instanceof Error ? error.message : "Could not submit issue.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-lg">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500">Profile, support, and issue reporting</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <section className="border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={avatarUrl}
                alt={effectiveProfile.displayName}
                label={effectiveProfile.displayName}
                className="w-20 h-20 text-2xl border border-gray-200"
                fallbackClassName="bg-blue-100 text-blue-700"
              />

              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{effectiveProfile.displayName}</p>
                <p className="text-sm text-gray-500 truncate">{effectiveProfile.userId}</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto || loadingProfile}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Upload size={16} />
              {uploadingPhoto ? "Uploading..." : "Change Profile Picture"}
            </button>

            {contactStatus && (
              <p className="text-sm text-gray-600">{contactStatus}</p>
            )}
          </section>

          <div className="space-y-6">
            <section className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 text-gray-900">
                <Mail size={18} />
                <h3 className="font-semibold">Contact Us</h3>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(event) => setContactSubject(event.target.value)}
                  placeholder="Subject"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                  maxLength={120}
                />
                <textarea
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  placeholder="How can we help?"
                  className="w-full min-h-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  required
                  minLength={10}
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black disabled:bg-gray-400"
                >
                  <LifeBuoy size={16} />
                  {submittingContact ? "Sending..." : "Send Message"}
                </button>
                {contactStatus && <p className="text-sm text-gray-600">{contactStatus}</p>}
              </form>
            </section>

            <section className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 text-gray-900">
                <AlertTriangle size={18} />
                <h3 className="font-semibold">Report Issue</h3>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-3">
                <input
                  type="text"
                  value={issueSubject}
                  onChange={(event) => setIssueSubject(event.target.value)}
                  placeholder="Issue summary"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                  maxLength={120}
                />
                <textarea
                  value={issueMessage}
                  onChange={(event) => setIssueMessage(event.target.value)}
                  placeholder="What happened, and how can it be reproduced?"
                  className="w-full min-h-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  required
                  minLength={10}
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300"
                >
                  <AlertTriangle size={16} />
                  {submittingIssue ? "Submitting..." : "Submit Issue"}
                </button>
                {issueStatus && <p className="text-sm text-gray-600">{issueStatus}</p>}
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
