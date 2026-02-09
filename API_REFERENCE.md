# HumanLayer API Reference

Complete API documentation for all backend endpoints.

**Base URL:** `http://localhost:3001/api/v1`

---

## Authentication

All protected routes require one of:
- **JWT Token:** `Authorization: Bearer <token>`
- **API Key:** `X-API-Key: hl_live_...`

---

## 📋 Table of Contents

1. [Auth Endpoints](#auth-endpoints)
2. [Provider Endpoints](#provider-endpoints)
3. [Listing Endpoints](#listing-endpoints)
4. [Quote Endpoints](#quote-endpoints)
5. [Order Endpoints](#order-endpoints)
6. [Payment Endpoints](#payment-endpoints)
7. [Review Endpoints](#review-endpoints)

---

## Auth Endpoints

### Register (Email/Password)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "role": "BUYER",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "abc123..."
    }
  }
}
```

---

### Login (Email/Password)
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:** Same as register

---

### Wallet Auth - Generate Nonce
```http
POST /api/v1/auth/wallet/nonce
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4..."
  }
}
```

---

### Wallet Auth - Verify Signature
```http
POST /api/v1/auth/wallet/verify
Content-Type: application/json

{
  "message": "HumanLayer wants you to sign in...\nNonce: a1b2c3d4...",
  "signature": "0xabc..."
}
```

**Response:** Same as register (returns user + tokens)

---

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "xyz789..."
  }
}
```

---

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "email": "user@example.com",
    "walletAddress": null,
    "role": "BUYER",
    "name": "John Doe",
    "providerProfile": null,
    "createdAt": "2026-02-08T..."
  }
}
```

---

### Become Provider
```http
POST /api/v1/auth/become-provider
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessName": "Pro Design Studio",
  "description": "Professional design services with 10 years experience",
  "websiteUrl": "https://example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "role": "PROVIDER",
    "providerProfile": {
      "id": "clx...",
      "businessName": "Pro Design Studio",
      "description": "Professional design...",
      "verificationStatus": "UNVERIFIED",
      "averageRating": null,
      "totalReviews": 0
    }
  }
}
```

---

### Create API Key
```http
POST /api/v1/auth/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Claude AI Agent",
  "permissions": [] // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "hl_live_abc123...", // SHOWN ONLY ONCE!
    "apiKey": {
      "id": "clx...",
      "keyPrefix": "hl_live_abc1",
      "label": "Claude AI Agent",
      "permissions": [],
      "createdAt": "2026-02-08T..."
    }
  }
}
```

---

### List API Keys
```http
GET /api/v1/auth/api-keys
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "keyPrefix": "hl_live_abc1",
      "label": "Claude AI Agent",
      "permissions": [],
      "lastUsedAt": "2026-02-08T...",
      "createdAt": "2026-02-08T..."
    }
  ]
}
```

---

### Revoke API Key
```http
DELETE /api/v1/auth/api-keys/:keyId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "API key revoked"
  }
}
```

---

## Provider Endpoints

### Get Dashboard Stats
```http
GET /api/v1/provider/dashboard
Authorization: Bearer <token>
Requires: PROVIDER role
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "businessName": "Pro Design Studio",
      "averageRating": 4.8,
      "totalReviews": 23,
      "verificationStatus": "VERIFIED",
      "stakeAmount": "100.000000"
    },
    "stats": {
      "totalListings": 5,
      "activeListings": 4,
      "totalOrders": 50,
      "activeOrders": 3,
      "completedOrders": 45,
      "totalRevenue": "12500.000000",
      "pendingQuotes": 2
    },
    "recentOrders": [
      {
        "id": "clx...",
        "orderNumber": "HL-2026-00042",
        "status": "IN_PROGRESS",
        "amount": "350.000000",
        "listingTitle": "Professional Logo Design",
        "buyerName": "Alice Smith",
        "createdAt": "2026-02-08T..."
      }
    ]
  }
}
```

---

### Update Provider Profile
```http
PATCH /api/v1/provider/profile
Authorization: Bearer <token>
Requires: PROVIDER role
Content-Type: application/json

{
  "businessName": "Updated Name", // optional
  "description": "Updated description", // optional
  "websiteUrl": "https://newurl.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "businessName": "Updated Name",
    "description": "Updated description",
    "websiteUrl": "https://newurl.com",
    "verificationStatus": "VERIFIED",
    "stakeAmount": "100.000000",
    "averageRating": 4.8,
    "totalReviews": 23
  }
}
```

---

### Get Provider Analytics
```http
GET /api/v1/provider/analytics?days=30
Authorization: Bearer <token>
Requires: PROVIDER role
```

**Query Parameters:**
- `days` - Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "orders": {
      "total": 15,
      "byStatus": {
        "completed": 12,
        "inProgress": 2,
        "cancelled": 1
      }
    },
    "quotes": {
      "total": 25,
      "accepted": 15,
      "conversionRate": "60.00%"
    },
    "topListings": [
      {
        "id": "clx...",
        "title": "Professional Logo Design",
        "orderCount": 8,
        "averageRating": 4.9
      }
    ]
  }
}
```

---

### Get Public Provider Profile
```http
GET /api/v1/provider/:userId/public
No authentication required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "John Doe",
    "profile": {
      "businessName": "Pro Design Studio",
      "description": "Professional design...",
      "websiteUrl": "https://example.com",
      "verificationStatus": "VERIFIED",
      "averageRating": 4.8,
      "totalReviews": 23,
      "totalOrders": 50
    },
    "listings": [
      {
        "id": "clx...",
        "title": "Professional Logo Design",
        "slug": "professional-logo-design",
        "category": "DESIGN",
        "basePrice": "350.000000",
        "averageRating": 4.9
      }
    ]
  }
}
```

---

## Listing Endpoints

### Search Listings
```http
GET /api/v1/listings?category=DESIGN&maxPrice=500&page=1&limit=20
No authentication required
```

**Query Parameters:**
- `category` - Filter by category (WRITING, DESIGN, etc.)
- `minPrice` - Minimum price in USDC
- `maxPrice` - Maximum price in USDC
- `tags` - Filter by tags (comma-separated)
- `minRating` - Minimum provider rating (1-5)
- `search` - Full-text search on title and description
- `sortBy` - Sort order (price_asc, price_desc, rating, newest)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "Professional Logo Design",
      "slug": "professional-logo-design",
      "description": "I'll create a modern...",
      "category": "DESIGN",
      "pricingModel": "FIXED",
      "basePrice": "350.000000",
      "specifications": {
        "designType": "Logo",
        "style": "Modern",
        "fileFormats": ["PNG", "SVG", "AI"],
        "revisions": 3
      },
      "tags": ["logo", "design", "branding"],
      "averageRating": 4.9,
      "totalReviews": 15
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Get Listing by ID or Slug
```http
GET /api/v1/listings/:idOrSlug
No authentication required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "Professional Logo Design",
    "slug": "professional-logo-design",
    "description": "Full description...",
    "category": "DESIGN",
    "pricingModel": "FIXED",
    "basePrice": "350.000000",
    "currency": "USDC",
    "specifications": { /* ... */ },
    "tags": ["logo", "design"],
    "availableSlots": 5,
    "isActive": true,
    "averageRating": 4.9,
    "totalReviews": 15,
    "provider": {
      "id": "clx...",
      "name": "John Doe",
      "providerProfile": {
        "businessName": "Pro Design Studio",
        "averageRating": 4.8
      }
    },
    "createdAt": "2026-01-15T..."
  }
}
```

---

### Create Listing
```http
POST /api/v1/listings
Authorization: Bearer <token>
Requires: PROVIDER role
Content-Type: application/json

{
  "title": "Professional Logo Design",
  "description": "I'll create a modern, minimalist logo...",
  "category": "DESIGN",
  "pricingModel": "FIXED",
  "basePrice": "350",
  "specifications": {
    "designType": "Logo",
    "style": "Modern",
    "fileFormats": ["PNG", "SVG", "AI"],
    "revisions": 3,
    "turnaroundDays": 7
  },
  "tags": ["logo", "design", "branding"],
  "availableSlots": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "Professional Logo Design",
    "slug": "professional-logo-design-1",
    /* ... full listing data ... */
  }
}
```

---

### Update Listing
```http
PATCH /api/v1/listings/:id
Authorization: Bearer <token>
Requires: PROVIDER role (must own listing)
Content-Type: application/json

{
  "title": "Updated Title", // optional
  "description": "Updated description", // optional
  "basePrice": "400", // optional
  "isActive": false // optional
  // ... any listing fields
}
```

**Response:** Updated listing object

---

### Delete Listing (Soft Delete)
```http
DELETE /api/v1/listings/:id
Authorization: Bearer <token>
Requires: PROVIDER role (must own listing)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Listing deleted"
  }
}
```

---

### Get My Listings
```http
GET /api/v1/listings/mine
Authorization: Bearer <token>
Requires: PROVIDER role
```

**Response:** Array of provider's listings

---

## Quote Endpoints

### Request Quote
```http
POST /api/v1/quotes
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": "clx...",
  "requirements": {
    "companyName": "TechFlow",
    "industry": "SaaS",
    "stylePreference": "Modern, tech-focused",
    "colorPreferences": "Blue, White"
  },
  "message": "Need a logo for my new SaaS startup" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "listingId": "clx...",
    "status": "PENDING",
    "requirements": { /* ... */ },
    "message": "Need a logo...",
    "createdAt": "2026-02-08T..."
  }
}
```

---

### List My Quotes
```http
GET /api/v1/quotes
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "status": "RESPONDED",
      "quotedPrice": "350.000000",
      "estimatedDays": 7,
      "listing": {
        "title": "Professional Logo Design"
      },
      "provider": {
        "name": "John Doe"
      },
      "createdAt": "2026-02-08T..."
    }
  ]
}
```

---

### Get Quote by ID
```http
GET /api/v1/quotes/:id
Authorization: Bearer <token>
```

**Response:** Full quote object with listing and provider details

---

### Respond to Quote (Provider)
```http
POST /api/v1/quotes/:id/respond
Authorization: Bearer <token>
Requires: PROVIDER role (must be quote provider)
Content-Type: application/json

{
  "quotedPrice": "350",
  "estimatedDays": 7,
  "providerNotes": "Happy to help! Will include 3 logo concepts...",
  "expiresAt": "2026-02-15T00:00:00Z" // optional
}
```

**Response:** Updated quote object with status "RESPONDED"

---

### Accept Quote (Buyer)
```http
POST /api/v1/quotes/:id/accept
Authorization: Bearer <token>
```

**Response:** Updated quote with status "ACCEPTED"

---

### Reject Quote (Buyer)
```http
POST /api/v1/quotes/:id/reject
Authorization: Bearer <token>
```

**Response:** Updated quote with status "REJECTED"

---

### Withdraw Quote (Buyer)
```http
POST /api/v1/quotes/:id/withdraw
Authorization: Bearer <token>
```

**Response:** Updated quote with status "WITHDRAWN"

---

## Order Endpoints

### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "quoteId": "clx..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "orderNumber": "HL-2026-00042",
    "status": "PENDING",
    "amount": "350.000000",
    "listingId": "clx...",
    "createdAt": "2026-02-08T..."
  }
}
```

---

### List My Orders
```http
GET /api/v1/orders
Authorization: Bearer <token>
```

**Response:** Array of user's orders (as buyer or provider)

---

### Get Order by ID
```http
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "orderNumber": "HL-2026-00042",
    "status": "IN_PROGRESS",
    "amount": "350.000000",
    "escrowTxHash": "0xabc...",
    "escrowId": "0x123...",
    "deliverables": null,
    "listing": {
      "title": "Professional Logo Design"
    },
    "provider": {
      "name": "John Doe"
    },
    "statusLogs": [
      {
        "fromStatus": null,
        "toStatus": "PENDING",
        "changedBy": "clx...",
        "createdAt": "2026-02-08T10:00:00Z"
      },
      {
        "fromStatus": "PENDING",
        "toStatus": "CONFIRMED",
        "changedBy": "clx...",
        "createdAt": "2026-02-08T10:15:00Z"
      }
    ],
    "createdAt": "2026-02-08T..."
  }
}
```

---

### Confirm Order (Internal - Called by payments service)
```http
POST /api/v1/orders/:id/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Escrow deposit confirmed" // optional
}
```

**Response:** Updated order with status "CONFIRMED"

---

### Start Work (Provider)
```http
POST /api/v1/orders/:id/start
Authorization: Bearer <token>
Requires: Must be order provider
Content-Type: application/json

{
  "reason": "Starting work on your logo" // optional
}
```

**Response:** Updated order with status "IN_PROGRESS"

---

### Deliver Order (Provider)
```http
POST /api/v1/orders/:id/deliver
Authorization: Bearer <token>
Requires: Must be order provider
Content-Type: application/json

{
  "deliverables": {
    "files": [
      "https://example.com/logo-final.png",
      "https://example.com/logo-final.svg",
      "https://example.com/logo-final.ai"
    ],
    "notes": "Included 3 concepts as promised!"
  },
  "reason": "Work completed and delivered" // optional
}
```

**Response:** Updated order with status "DELIVERED"

---

### Complete Order (Buyer)
```http
POST /api/v1/orders/:id/complete
Authorization: Bearer <token>
Requires: Must be order buyer
Content-Type: application/json

{
  "reason": "Satisfied with the work" // optional
}
```

**Response:** Updated order with status "COMPLETED"

**Note:** This triggers escrow release

---

### Dispute Order
```http
POST /api/v1/orders/:id/dispute
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Work does not match requirements"
}
```

**Response:** Updated order with status "DISPUTED"

---

### Cancel Order
```http
POST /api/v1/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind" // optional
}
```

**Response:** Updated order with status "CANCELLED"

---

## Payment Endpoints

### Get Escrow Info
```http
GET /api/v1/payments/:orderId/escrow
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "clx...",
    "amount": "350.000000",
    "escrowContractAddress": "0xABC...",
    "usdcAddress": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "chainId": 84532,
    "abi": [ /* escrow contract ABI */ ]
  }
}
```

---

### Confirm Deposit
```http
POST /api/v1/payments/:orderId/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "txHash": "0xabc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "clx...",
    "status": "CONFIRMED",
    "escrowTxHash": "0xabc123...",
    "transaction": {
      "txHash": "0xabc123...",
      "type": "ESCROW_DEPOSIT",
      "amount": "350.000000",
      "status": "CONFIRMED"
    }
  }
}
```

---

### Release Payment
```http
POST /api/v1/payments/:orderId/release
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "clx...",
    "message": "Payment release initiated",
    "txHash": "0xdef456..."
  }
}
```

---

## Review Endpoints

### List Reviews
```http
GET /api/v1/reviews?listingId=clx...&page=1&limit=20
No authentication required
```

**Query Parameters:**
- `listingId` - Filter by listing
- `providerId` - Filter by provider
- `page` - Page number
- `limit` - Results per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "rating": 5,
      "comment": "Amazing work! Logo is perfect for our brand.",
      "providerReply": "Thank you! It was a pleasure working with you.",
      "reviewer": {
        "name": "Alice Smith"
      },
      "createdAt": "2026-02-08T...",
      "providerRepliedAt": "2026-02-09T..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### Submit Review
```http
POST /api/v1/reviews
Authorization: Bearer <token>
Requires: Order must be COMPLETED
Content-Type: application/json

{
  "orderId": "clx...",
  "rating": 5,
  "comment": "Amazing work! Logo is perfect for our brand."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "orderId": "clx...",
    "rating": 5,
    "comment": "Amazing work!...",
    "createdAt": "2026-02-08T..."
  }
}
```

---

### Reply to Review (Provider)
```http
POST /api/v1/reviews/:id/reply
Authorization: Bearer <token>
Requires: Must be the provider who received the review
Content-Type: application/json

{
  "providerReply": "Thank you! It was a pleasure working with you."
}
```

**Response:** Updated review with provider reply

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { /* optional additional info */ }
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Not authorized for this action (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists (409)
- `VALIDATION_ERROR` - Invalid request data (400)
- `INTERNAL_ERROR` - Server error (500)

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- Auth endpoints: 5 requests/minute
- Search endpoints: 60 requests/minute
- Write endpoints: 20 requests/minute

---

## Testing with curl

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Search listings (no auth)
curl http://localhost:3001/api/v1/listings?category=DESIGN&maxPrice=500

# Get dashboard stats (with auth)
curl http://localhost:3001/api/v1/provider/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create listing (with auth)
curl -X POST http://localhost:3001/api/v1/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Logo Design",
    "description":"Professional logo",
    "category":"DESIGN",
    "pricingModel":"FIXED",
    "basePrice":"350",
    "specifications":{"designType":"Logo"},
    "tags":["logo","design"],
    "availableSlots":5
  }'
```

---

## WebSocket Events (Future)

Not yet implemented. Planned for real-time updates:
- `quote:responded` - Provider responded to your quote
- `order:status_changed` - Order status updated
- `message:received` - New message in order chat

---

**Last Updated:** February 8, 2026
**API Version:** v1
**Backend Version:** 0.1.0
