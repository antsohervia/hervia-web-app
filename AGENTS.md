<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design rules

- **Admin tenant (`app/(tenant)/[subdomain]/admin/**`) : mobile-first.** Partir des classes Tailwind sans préfixe (mobile) puis élargir avec `sm:`/`md:`/`lg:`. Cibles tactiles ≥ 44px, table → cards empilées en mobile (table à partir de `md:`), navigation en drawer/bottom-nav en mobile, formulaires en colonne unique, boutons d'action pleine largeur en mobile. Tester d'abord à ~375px.
