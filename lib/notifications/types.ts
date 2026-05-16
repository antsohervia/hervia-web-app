import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationEventType =
  | "parcel.status_changed"
  | "parcel.created";

export type NotificationChannelId =
  | "email"
  | "inapp"
  | "sms"
  | "push"
  | "webhook";

export type NotificationRecord = {
  id: string;
  tenant_id: string;
  recipient_client_id: string;
  event_type: NotificationEventType;
  subject_type: string | null;
  subject_id: string | null;
  title: string;
  body: string | null;
  link_url: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

export type NotificationContext = {
  notification: NotificationRecord;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    logo_url: string | null;
    primary_color: string;
  };
  client: {
    id: string;
    full_name: string;
    email: string | null;
    user_id: string | null;
    status: string;
  };
};

export type ChannelSendResult =
  | { ok: true; providerMessageId?: string | null }
  | { ok: false; error: string; retryable: boolean };

export interface NotificationChannel {
  readonly id: NotificationChannelId;
  /**
   * True si le canal doit recevoir une ligne d'outbox pour cette
   * notification. Combine la préférence utilisateur ET les conditions
   * techniques (ex. email channel = client.email présent).
   */
  isEnabledFor(ctx: NotificationContext, admin: SupabaseClient): Promise<boolean>;
  send(ctx: NotificationContext): Promise<ChannelSendResult>;
}
