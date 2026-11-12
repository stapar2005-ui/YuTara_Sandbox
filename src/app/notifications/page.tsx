"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import {
  readNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from "@/lib/notification-service";

export default function NotificationsPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      if (current?.email) {
        const notifs = await readNotifications(current.email);
        setNotifications(notifs);
      }
      setLoaded(true);
    };
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="app-shell">
        <AppLayout session={null} pageTitle="Notifications" showSearch={false}>
          <div className="container">
            <div className="eyebrow">Notifications</div>
            <h1 className="display">Notifications</h1>
            <div className="empty-state">
              <span className="spinner" />
            </div>
          </div>
        </AppLayout>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <AppLayout session={null} pageTitle="Notifications" showSearch={false}>
          <div className="container">
            <div className="eyebrow">Notifications</div>
            <h1 className="display">Notifications</h1>
            <div className="empty-state">
              <Bell size={48} />
              <h3>Please sign in to view notifications.</h3>
              <p>Sign in to see your notifications.</p>
            </div>
          </div>
        </AppLayout>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const handleMarkAllRead = async () => {
    if (session.email) {
      await markAllNotificationsRead(session.email);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="Notifications"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Notifications</div>
              <h1>Notifications</h1>
              <p className="muted">
                Stay updated on your inquiries, bookings, and transactions.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost"
                onClick={handleMarkAllRead}
                style={{ marginLeft: "auto" }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h3>No notifications yet.</h3>
              <p>
                Your notifications will appear here when you receive updates
                about your inquiries, bookings, or transactions.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr
                      key={n.id}
                      className={!n.isRead ? "notification-unread" : ""}
                    >
                      <td>
                        <strong>{n.title}</strong>
                      </td>
                      <td className="muted">{n.description}</td>
                      <td>
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            n.isRead ? "badge-green" : "badge-amber"
                          }`}
                        >
                          {n.isRead ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td>
                        {n.actionUrl ? (
                          <Link
                            href={n.actionUrl}
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (!n.isRead && session?.email) {
                                handleMarkRead(n.id);
                              }
                            }}
                          >
                            Go <ChevronRight size={14} />
                          </Link>
                        ) : !n.isRead ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            Mark read
                          </button>
                        ) : (
                          <FileText size={14} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    </div>
  );
}
