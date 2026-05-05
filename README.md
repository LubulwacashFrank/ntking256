# Agro Tech Connect - Full Structure

The project is now generated with a clean folder structure:

- `client/` - frontend app
  - `index.html`
  - `css/styles.css`
  - `js/api.js`
  - `js/app.js`
- `server/` - backend app
  - `index.js`
  - `app.js`
  - `data/store.js`
  - `routes/*.routes.js`
  - `services/priceTicker.js`

## Quick start

1. Install dependencies

```bash
npm install
```

2. Configure environment

Copy `.env.example` to `.env` and update values:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

3. Run app

```bash
npm start
```

4. Open in browser

`http://localhost:3000`

Admin interface: `http://localhost:3000/admin`  
Farmer/Bulk buyer auth: `http://localhost:3000/auth`

## Single system runtime

- Primary runtime is the modular app in `server/` + `client/`.
- `npm start` and `npm run dev` both run that same modular system.
- `server.js` is kept as a compatibility entrypoint and now launches the same modular app.

## Available scripts

- `npm start` - run backend
- `npm run dev` - run backend with watch mode

## API endpoints

- `GET /api/bootstrap`
- `GET /api/products?q=&district=`
- `GET /api/live-prices`
- `GET /api/weather`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `POST /api/bulk-inquiries`
- `POST /api/auth/register` (farmer/bulk_buyer)
- `POST /api/auth/login`
- `GET /api/admin/stats` (admin token required)
- `GET /api/admin/users` (admin token required)
- `GET /api/admin/inquiries` (admin token required)
