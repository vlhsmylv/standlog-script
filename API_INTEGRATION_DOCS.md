# StandLog Analytics - Backend API Integration Documentation

## Overview

This document outlines the API integration requirements for the StandLog Analytics frontend script. The script sends data to your backend using two main endpoints that correspond to your Prisma schema models.

## Authentication

**No authentication required** - The API is open and publicly accessible. No API keys or authorization headers are needed.

## Endpoints

### 1. Session Creation

**Endpoint:** `POST /session`

**Description:** Creates a new session record when a user first visits the site.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "anonymousId": "user_1726239847123_xyz789abc",
  "metadata": {
    "device": {
      "type": "desktop",
      "browser": "Chrome",
      "language": "en-US",
      "viewport": {
        "width": 1366,
        "height": 768
      }
    },
    "browser": "Chrome",
    "os": "macOS",
    "language": "en-US",
    "timezone": "America/New_York",
    "screen": {
      "width": 1920,
      "height": 1080
    },
    "viewport": {
      "width": 1366,
      "height": 768
    },
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "referrer": "https://google.com/search?q=analytics",
    "initialUrl": "https://yoursite.com/landing",
    "initialTitle": "Landing Page - Your Site"
  }
}
```

**Expected Response:**

```json
{
  "id": "clxyz123abc456def789",
  "anonymousId": "user_1726239847123_xyz789abc",
  "success": true
}
```

**Prisma Model Mapping:**

- Maps to `Session` model
- `anonymousId` → `Session.anonymousId` (unique field)
- `metadata` → `Session.metadata` (JSON field)
- Auto-generates `Session.id`, `Session.createdAt`, `Session.updatedAt`

---

### 2. Event Tracking

**Endpoint:** `POST /events`

**Description:** Sends batched user interaction events linked to a session.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "events": [
    {
      "type": "pageview",
      "metadata": {
        "url": "https://yoursite.com/products",
        "title": "Products - Your Site",
        "timestamp": 1726239847123,
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "viewport": {
          "width": 1366,
          "height": 768
        },
        "page": {
          "url": "https://yoursite.com/products",
          "title": "Products - Your Site",
          "referrer": "https://yoursite.com/landing"
        }
      },
      "data": {
        "sessionId": "clxyz123abc456def789",
        "userId": "user_1726239847123_xyz789abc",
        "timestamp": 1726239847123,
        "page": {
          "url": "https://yoursite.com/products",
          "title": "Products - Your Site",
          "referrer": "https://yoursite.com/landing"
        },
        "device": {
          "type": "desktop",
          "browser": "Chrome",
          "language": "en-US"
        },
        "viewport": {
          "width": 1366,
          "height": 768
        }
      }
    },
    {
      "type": "click",
      "metadata": {
        "url": "https://yoursite.com/products",
        "title": "Products - Your Site",
        "timestamp": 1726239850456,
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "viewport": {
          "width": 1366,
          "height": 768
        },
        "page": {
          "url": "https://yoursite.com/products",
          "title": "Products - Your Site",
          "referrer": "https://yoursite.com/landing"
        }
      },
      "data": {
        "sessionId": "clxyz123abc456def789",
        "userId": "user_1726239847123_xyz789abc",
        "timestamp": 1726239850456,
        "coordinates": {
          "x": 245,
          "y": 150,
          "pageX": 245,
          "pageY": 1150
        },
        "element": {
          "tagName": "button",
          "id": "add-to-cart-btn",
          "className": "btn btn-primary add-cart",
          "textContent": "Add to Cart",
          "attributes": {
            "data-product-id": "12345",
            "type": "button"
          },
          "selector": "#add-to-cart-btn"
        },
        "viewport": {
          "width": 1366,
          "height": 768
        }
      }
    }
  ]
}
```

**Expected Response:**

```json
{
  "success": true,
  "eventsProcessed": 2,
  "sessionId": "clxyz123abc456def789"
}
```

**Prisma Model Mapping:**

- Maps to `Event` model
- Each event in the array becomes a separate `Event` record
- `sessionId` → `Event.sessionId` (foreign key to Session)
- `type` → `Event.type`
- `metadata` → `Event.metadata` (JSON field)
- `data` → `Event.data` (JSON field)
- Auto-generates `Event.id`, `Event.createdAt`

## Event Types and Data Structures

### 1. Page View Events

**Type:** `"pageview"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239847123,
  "page": {
    "url": "https://yoursite.com/page",
    "title": "Page Title",
    "referrer": "https://google.com"
  },
  "device": {
    "type": "desktop",
    "browser": "Chrome",
    "language": "en-US"
  },
  "viewport": {
    "width": 1366,
    "height": 768
  }
}
```

### 2. Click Events

**Type:** `"click"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239850456,
  "coordinates": {
    "x": 245,
    "y": 150,
    "pageX": 245,
    "pageY": 1150
  },
  "element": {
    "tagName": "button",
    "id": "signup-btn",
    "className": "btn btn-primary",
    "textContent": "Sign Up Now",
    "attributes": {
      "data-action": "signup",
      "type": "button"
    },
    "selector": "#signup-btn"
  },
  "viewport": {
    "width": 1366,
    "height": 768
  }
}
```

### 3. Scroll Events

**Type:** `"scroll"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239851789,
  "scroll": {
    "x": 0,
    "y": 1250,
    "maxX": 0,
    "maxY": 3500
  },
  "viewport": {
    "width": 1366,
    "height": 768
  }
}
```

### 4. Form Submit Events

**Type:** `"form_submit"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239852123,
  "form": {
    "id": "contact-form",
    "action": "/submit-contact",
    "method": "POST",
    "fields": [
      {
        "name": "email",
        "type": "email",
        "value": "user@example.com"
      },
      {
        "name": "password",
        "type": "password",
        "value": "[HIDDEN]"
      },
      {
        "name": "message",
        "type": "textarea",
        "value": "Hello, I'm interested in..."
      }
    ]
  },
  "page": {
    "url": "https://yoursite.com/contact",
    "title": "Contact Us"
  }
}
```

### 5. Custom Events

**Type:** `"custom"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239853456,
  "name": "product_purchased",
  "properties": {
    "productId": "12345",
    "productName": "Premium Plan",
    "price": 99.99,
    "currency": "USD",
    "category": "subscription"
  },
  "page": {
    "url": "https://yoursite.com/checkout/success",
    "title": "Purchase Complete"
  }
}
```

### 6. Visibility Change Events

**Type:** `"visibility_change"`

**Data Structure:**

```json
{
  "sessionId": "clxyz123abc456def789",
  "userId": "user_1726239847123_xyz789abc",
  "timestamp": 1726239854789,
  "visible": false,
  "page": {
    "url": "https://yoursite.com/pricing",
    "title": "Pricing Plans"
  }
}
```

## Implementation Notes

### Session Management

1. **Session Creation Logic:**

   - Frontend generates session ID and anonymous ID per browser tab
   - Anonymous ID stored in sessionStorage (tab-specific, not persistent)
   - Session created once per tab via session endpoint
   - Session ID is reused for all subsequent events in that tab

2. **Session ID Format:**

   - Generated client-side using timestamp + random string
   - Format: `session_${timestamp}_${randomString}`
   - Example: `session_1726239847123_abc123def456`

3. **Anonymous ID Format:**
   - Session-based user identifier stored in sessionStorage
   - New anonymous ID generated per browser tab/session
   - Format: `user_${timestamp}_${randomString}`
   - Example: `user_1726239847123_xyz789abc`
   - **Important:** Anonymous ID is unique per browser tab, not persistent across sessions

### Event Batching

1. **Batch Size:** Events are sent in batches of 10 or when page unloads
2. **Timing:** Events queue locally and send asynchronously
3. **Retry Logic:** No automatic retry on failure (logs error if debug enabled)

### Error Handling

1. **Network Failures:** Logged to console if debug mode enabled
2. **Invalid Responses:** Gracefully handled, operation continues
3. **Missing Session:** Automatically creates session before sending events

### Data Privacy

1. **Password Fields:** Form values for password inputs are replaced with `"[HIDDEN]"`
2. **PII Scrubbing:** No automatic PII detection (implement server-side if needed)
3. **Opt-out:** Users can disable tracking via browser settings

## Server-Side Implementation Requirements

### Database Schema (Prisma)

Your existing schema is perfect. Ensure these indexes for performance:

```prisma
model Session {
  id          String   @id @default(cuid())
  anonymousId String   @unique
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  events      Event[]

  @@index([anonymousId])
  @@index([createdAt])
}

model Event {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  type      String
  metadata  Json?
  data      Json?
  createdAt DateTime @default(now())

  @@index([sessionId])
  @@index([type])
  @@index([createdAt])
}
```

### Required Endpoints

#### POST /session

```typescript
async function createSession(sessionData: {
  anonymousId: string;
  metadata: any;
}) {
  // 1. Check if session with anonymousId already exists
  // 2. If exists, return existing session
  // 3. If not, create new session
  // 4. Return session ID and success status
}
```

#### POST /events

```typescript
async function createEvents(eventsData: {
  sessionId: string;
  events: Array<{
    type: string;
    metadata: any;
    data: any;
  }>;
}) {
  // 1. Verify sessionId exists
  // 2. Create event records in batch
  // 3. Return success status and count
}
```

### Recommended Validation

1. **Session Validation:** Ensure sessionId exists before creating events
2. **Rate Limiting:** Implement IP-based rate limits for abuse protection
3. **Data Validation:** Validate JSON structure and required fields
4. **CORS Setup:** Configure CORS to allow cross-origin requests
5. **Input Sanitization:** Sanitize user input to prevent XSS/injection attacks

### Performance Considerations

1. **Batch Inserts:** Use Prisma's `createMany` for event batches
2. **Background Processing:** Consider queuing heavy analytics processing
3. **Database Indexes:** Index on sessionId, type, and createdAt fields
4. **Compression:** Enable gzip compression for API responses

## Testing

### Sample Requests

You can test the integration using these curl commands:

**Create Session:**

```bash
curl -X POST "https://your-api.com/session" \
  -H "Content-Type: application/json" \
  -d '{
    "anonymousId": "user_1726239847123_test123",
    "metadata": {
      "browser": "Chrome",
      "os": "macOS",
      "language": "en-US",
      "initialUrl": "https://test.com"
    }
  }'
```

**Send Events:**

```bash
curl -X POST "https://your-api.com/events" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clxyz123abc456def789",
    "events": [
      {
        "type": "pageview",
        "metadata": {
          "url": "https://test.com",
          "title": "Test Page",
          "timestamp": 1726239847123
        },
        "data": {
          "sessionId": "clxyz123abc456def789",
          "userId": "user_1726239847123_test123",
          "timestamp": 1726239847123
        }
      }
    ]
  }'
```

## Questions or Issues

If you need clarification on any part of this integration, please let me know. The frontend script is ready and will start sending data as soon as your endpoints are available.
