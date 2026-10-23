# YuTara

YuTara is a land marketplace for Panabo City, Davao del Norte — helping people
discover verified land, connect directly with sellers, and move from interest to
a reservation with confidence.

The experience covers the full journey:

```
Home  ->  Login / Register  ->  Marketplace  ->  Buy or Sell land  ->  Transact
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home, marketplace, seller workspace, and verification desk |
| `/login` | Sign in |
| `/register` | Create an account and complete identity verification |
| `/marketplace` | Marketplace (card and map discovery) |
| `/marketplace/map` | Verified-property map |
| `/marketplace/[id]` | Property detail and verification context |
| `/reservation/[propertyId]` | Reservation and payment |
| `/dashboard` | Buyer dashboard, assets, and transaction records |

Seller, buyer, and administrator areas are role-aware: seller tools appear for
signed-in sellers, and the administrator verification desk is only reachable by
an admin account.

## Sample accounts

| Email | Role | Password |
| --- | --- | --- |
| `buyer@yutara.com` | Buyer | `12345` |
| `seller@yutara.com` | Seller | `12345` |
| `user@yutara.com` | Buyer/Seller | `12345` |
| `admin@yutara.com` | Administrator | `12345` |

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Validation

```bash
npm run lint
npm run build
```

These checks run in GitHub Actions on pushes and pull requests.

## Notes

This build is a product demonstration. Listings, identity checks, reservations,
and payments are illustrative and are stored in the browser; it is not yet
connected to a live database or payment provider.
