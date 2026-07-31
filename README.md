# Mazza Admin

Professional operations workspace for the Mazza platform.

## Included modules

- Executive dashboard: revenue, bookings, active users and properties
- User, agent, property, booking and transaction workspaces
- Agent approval and property moderation actions
- Withdrawal-review queue UI, finance summaries and responsive mobile layout
- Loading-ready table, search and status UI patterns

## Run locally

```bash
npm install
npm run dev
```

`npm run build` verifies the production bundle.

## Backend contract

The backend exposes the staff-only foundation endpoint at:

`GET /api/v1/admin/platform/?section=dashboard|users|properties|bookings`

It requires a JWT for a user with the `admin` role, `is_staff`, or `is_superuser`.
Available staff actions use `POST /api/v1/admin/platform/`:

- `approve_agent` with `user_id`
- `set_property_status` with `property_id` and `is_active`

The web client is deliberately presentation-first while the remaining admin workflows are connected incrementally to this protected contract; it never relies on public customer endpoints for privileged actions.
