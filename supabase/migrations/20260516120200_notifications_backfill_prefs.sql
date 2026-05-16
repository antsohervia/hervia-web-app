-- Backfill notification_preferences depuis clients.email_notifications_enabled
-- Le nouveau modèle : "aucune ligne = enabled = true" (opt-out).
-- On n'insère donc une ligne explicite que pour les clients désinscrits.
insert into public.notification_preferences (client_id, channel, event_type, enabled)
select id, 'email', '*', false
from public.clients
where email_notifications_enabled = false
on conflict (client_id, channel, event_type) do nothing;
