# Privora – REST & WebSocket API Documentation

## 1. Introduction

This document describes all APIs used by the Privora chat application.

**Intended Audience:**
- Engineers implementing or maintaining the REST API
- Engineers implementing or maintaining the WebSocket server
- Frontend developers integrating with the backend
- Anyone ensuring authentication and security compatibility

**Technology Stack:**
- **Frontend:** React (TypeScript)
- **Communication:** HTTP REST APIs (JSON) + WebSocket APIs (JSON)
- **Authentication:** Firebase Authentication

---

## 2. Authentication & Security Model

### 2.1 Authentication Provider

| Component | Details |
|-----------|---------|
| **Provider** | Firebase Authentication |
| **Token Type** | Firebase ID Token (JWT) |
| **Token Storage** | Browser localStorage |
| **Token Lifetime** | ~1 hour (auto-refreshed by Firebase SDK) |

### 2.2 Token Usage

The Firebase ID Token is:
- ✅ Sent as a Bearer token for REST requests
- ✅ Sent during WebSocket login handshake
- ✅ Verified server-side using Firebase Admin SDK

> ⚠️ **Critical Security Rule**
> 
> Backend MUST NOT trust client-provided user identifiers. Always derive user identity from the verified token.

### 2.3 Authentication Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Client  │                 │ Backend  │                 │ Firebase │
│ (React)  │                 │  Server  │                 │   Auth   │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ 1. User logs in            │                            │
     │────────────────────────────┼───────────────────────────>│
     │                            │                            │
     │ 2. Firebase ID Token       │                            │
     │<───────────────────────────┼────────────────────────────│
     │                            │                            │
     │ 3. Store in localStorage   │                            │
     │────────┐                   │                            │
     │        │                   │                            │
     │<───────┘                   │                            │
     │                            │                            │
     │ 4. REST: Bearer Token      │                            │
     │───────────────────────────>│                            │
     │                            │                            │
     │                            │ 5. Verify Token            │
     │                            │───────────────────────────>│
     │                            │                            │
     │                            │ 6. User Info (email, name) │
     │                            │<───────────────────────────│
     │                            │                            │
     │ 7. Response with Data      │                            │
     │<───────────────────────────│                            │
     │                            │                            │
```

---

## 3. REST API

### 3.1 Base URL

**Development:**
```
http://localhost:8080
```

**Production:**
```
https://your-domain.com
```

> ⚠️ Production environments MUST use HTTPS.

---

### 3.2 Search Users API

Search for registered users to start new conversations.

#### Endpoint

```
GET /search-users
```

#### Purpose

Allows users to search for other registered users in order to:
- Start a new chat conversation
- Find users to add to recent chats

#### Query Parameters

| Name | Type   | Required | Description                 | Constraints |
|------|--------|----------|-----------------------------|-------------|
| `q`  | string | ✅ Yes   | Search term (name or email) | Min 1 char  |

#### Headers

```http
Authorization: Bearer <Firebase-ID-Token>
Content-Type: application/json
```

#### Request Example

```bash
GET /search-users?q=ali HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIzYzRkNWU2Zj...
Content-Type: application/json
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8080/search-users?q=ali" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

#### Response Example (200 OK)

```json
[
  {
    "userId": "alice@example.com",
    "displayName": "Alice Johnson"
  },
  {
    "userId": "alina@example.com",
    "displayName": "Alina Smith"
  }
]
```

**Response Fields:**

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `userId`      | string | Unique user identifier (email) |
| `displayName` | string | User's display name            |

#### Error Responses

| Status Code | Reason                      | Response Body |
|-------------|-----------------------------|---------------|
| `400`       | Missing or empty query      | `{"error": "Query parameter 'q' is required"}` |
| `401`       | Invalid or missing token    | `{"error": "Unauthorized"}` |
| `500`       | Internal server error       | `{"error": "Internal server error"}` |

#### Backend Implementation Notes

- ✅ Results should be limited (e.g., max 10 users)
- ✅ Should exclude the requesting user from results
- ✅ Should be case-insensitive matching
- ✅ Partial matches are supported (e.g., "ali" matches "Alice" and "Alina")
- ✅ Search should match both display name and email

---

## 4. WebSocket API

### 4.1 Connection URL

**Development:**
```
ws://localhost:8080/ws
```

**Production:**
```
wss://your-domain.com/ws
```

> ⚠️ Production environments MUST use WSS (WebSocket Secure).

---

### 4.2 Connection Lifecycle

```
┌──────────┐                           ┌──────────┐
│  Client  │                           │  Server  │
└────┬─────┘                           └────┬─────┘
     │                                      │
     │ 1. Open WebSocket Connection         │
     │─────────────────────────────────────>│
     │                                      │
     │ 2. Connection Established            │
     │<─────────────────────────────────────│
     │                                      │
     │ 3. Send Login Message (with token)   │
     │─────────────────────────────────────>│
     │                                      │
     │                           4. Verify Token with Firebase
     │                                      │────────┐
     │                                      │        │
     │                                      │<───────┘
     │                                      │
     │                           5. Bind socket to user
     │                                      │────────┐
     │                                      │        │
     │                                      │<───────┘
     │                                      │
     │ 6. Ready to send/receive messages    │
     │<─────────────────────────────────────│
     │                                      │
     │ 7. Send Chat Message                 │
     │─────────────────────────────────────>│
     │                                      │
     │                           8. Route to recipient
     │                                      │────────┐
     │                                      │        │
     │                                      │<───────┘
     │                                      │
     │ 9. Receive Messages                  │
     │<─────────────────────────────────────│
     │                                      │
```

**Lifecycle Steps:**

1. **Client opens WebSocket connection** to `/ws`
2. **Server accepts connection** (not yet authenticated)
3. **Client sends login message** with Firebase token
4. **Server validates token** using Firebase Admin SDK
5. **Server associates socket with authenticated user**
6. **Server begins routing messages** to/from the user

---

### 4.3 WebSocket Authentication Message

#### Client → Server (Login)

**Message Type:** `login`

```json
{
  "type": "login",
  "token": "<Firebase-ID-Token>"
}
```

**Fields:**

| Field   | Type   | Required | Description           |
|---------|--------|----------|-----------------------|
| `type`  | string | ✅ Yes   | Must be `"login"`     |
| `token` | string | ✅ Yes   | Firebase ID Token JWT |

#### Server Behavior

Upon receiving a login message, the server:

1. ✅ Verifies token using Firebase Admin SDK
2. ✅ Extracts user information:
   - `userId` (email or Firebase UID)
   - `displayName` (user's display name)
3. ✅ Binds the WebSocket connection to the authenticated user
4. ❌ Rejects connection if token is invalid or expired

**Example Implementation Flow:**

```
Token Valid?
     │
     ├─ YES ──> Extract userId & displayName
     │          └──> Bind socket to user
     │               └──> User is now "online"
     │
     └─ NO ──> Send error message
              └──> Close connection
```

---

### 4.4 Chat Message (Client → Server)

**Message Type:** `message`

#### Payload

```json
{
  "type": "message",
  "to": "recipient@example.com",
  "message": "Hello there!",
  "fromDisplayName": "John Doe"
}
```

#### Field Definitions

| Field             | Type   | Required | Description                           |
|-------------------|--------|----------|---------------------------------------|
| `type`            | string | ✅ Yes   | Must be `"message"`                   |
| `to`              | string | ✅ Yes   | Recipient user identifier (email/UID) |
| `message`         | string | ✅ Yes   | Message body/content                  |
| `fromDisplayName` | string | ✅ Yes   | Sender's display name (UI only)       |

> ⚠️ **Security Warning**
> 
> Backend MUST ignore `fromDisplayName` for identity validation. Always use the authenticated user identity from the verified token, not from the client payload.

#### Example

```json
{
  "type": "message",
  "to": "alice@example.com",
  "message": "Hey Alice, how are you?",
  "fromDisplayName": "Bob Smith"
}
```

---

### 4.5 Chat Message (Server → Client)

**Message Type:** `message`

When the server forwards a message to a recipient, it sends:

```json
{
  "type": "message",
  "from": "alice@example.com",
  "fromDisplayName": "Alice",
  "message": "Hello!"
}
```

#### Field Definitions

| Field             | Type   | Description                      |
|-------------------|--------|----------------------------------|
| `type`            | string | Always `"message"`               |
| `from`            | string | Sender's user identifier (email) |
| `fromDisplayName` | string | Sender's display name            |
| `message`         | string | Message content                  |

#### Backend Responsibilities

When processing outgoing messages, the backend must:

1. ✅ Validate sender identity (from authenticated token, not payload)
2. ✅ Persist message to database (if message history is supported)
3. ✅ Forward message to recipient if currently online
4. ✅ Store message for offline delivery (optional, if implemented)

**Message Routing Flow:**

```
Message Received from Client
          │
          ├──> 1. Validate sender from token
          │
          ├──> 2. Save to database
          │
          ├──> 3. Check if recipient is online
          │         │
          │         ├─ YES ──> Forward immediately
          │         │
          │         └─ NO ──> Queue for later delivery (optional)
          │
          └──> 4. Confirm delivery (optional)
```

---

### 4.6 Message History Payload (Optional)

**Message Type:** `history`

If the backend supports message history, it can send stored messages to the client:

```json
{
  "type": "history",
  "messages": [
    {
      "from": "alice@example.com",
      "message": "Hi, how are you?",
      "timestamp": 1712345678
    },
    {
      "from": "bob@example.com",
      "message": "I'm good, thanks!",
      "timestamp": 1712345680
    }
  ]
}
```

#### Field Definitions

| Field              | Type     | Description                           |
|--------------------|----------|---------------------------------------|
| `type`             | string   | Always `"history"`                    |
| `messages`         | array    | Array of historical messages          |
| `messages[].from`  | string   | Sender's user identifier              |
| `messages[].message` | string | Message content                       |
| `messages[].timestamp` | number | Unix timestamp (seconds)            |

#### When History is Sent

- **After login:** Server may automatically send recent messages
- **On chat selection:** When user opens a conversation in the UI
- **On explicit request:** If the client requests history (implementation-specific)

---

### 4.7 Contacts / Recent Chats Payload (Optional)

**Message Type:** `contacts`

Used to populate the sidebar with recent conversations:

```json
{
  "type": "contacts",
  "contacts": [
    {
      "userId": "bob@example.com",
      "displayName": "Bob"
    },
    {
      "userId": "charlie@example.com",
      "displayName": "Charlie"
    }
  ]
}
```

#### Field Definitions

| Field                   | Type   | Description                        |
|-------------------------|--------|------------------------------------|
| `type`                  | string | Always `"contacts"`                |
| `contacts`              | array  | Array of contact/recent chat users |
| `contacts[].userId`     | string | User identifier (email/UID)        |
| `contacts[].displayName`| string | User's display name                |

#### Usage

- Sent after successful login
- Helps populate the chat sidebar with recent conversations
- May be sorted by last message time (implementation-specific)

---

## 5. Error Handling

### 5.1 WebSocket Error Message (Recommended)

**Message Type:** `error`

```json
{
  "type": "error",
  "message": "Unauthorized"
}
```

#### Field Definitions

| Field     | Type   | Description                    |
|-----------|--------|--------------------------------|
| `type`    | string | Always `"error"`               |
| `message` | string | Human-readable error message   |

### 5.2 Common Error Scenarios

| Error Reason             | Message                    | Recommended Action         |
|--------------------------|----------------------------|----------------------------|
| Invalid token            | `"Unauthorized"`           | Re-authenticate with Firebase |
| Token expired            | `"Token expired"`          | Refresh token and reconnect |
| User not found           | `"User not found"`         | Check user ID              |
| Recipient offline        | `"Recipient offline"`      | Queue message or notify user |
| Internal server error    | `"Internal server error"`  | Retry or contact support   |

### 5.3 Error Handling Flow

```
Error Occurs
     │
     ├──> 1. Server logs error details
     │
     ├──> 2. Server sends error message to client
     │         {
     │           "type": "error",
     │           "message": "..."
     │         }
     │
     └──> 3. Client handles error
              │
              ├─ Auth Error ──> Redirect to login
              │
              ├─ Connection Error ──> Show retry button
              │
              └─ Message Error ──> Show user-friendly message
```

---

## 6. Environment Variables

### 6.1 Frontend Environment Variables

Create a `.env` file in the frontend root directory:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080/ws
```

**For Production:**
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WS_URL=wss://api.yourdomain.com/ws
```

### 6.2 Backend Environment Variables

Firebase Admin SDK credentials (keep these secret):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
```

> ⚠️ **Security Warning**
> 
> - Never commit these credentials to version control
> - Use environment-specific configuration
> - Restrict access to production credentials

---

## 7. Security Considerations

### 7.1 Transport Layer Security

| Environment | Protocol | Encryption |
|-------------|----------|------------|
| Development | `ws://`, `http://` | ❌ No encryption (acceptable for localhost) |
| Production | `wss://`, `https://` | ✅ TLS encryption (mandatory) |

> ⚠️ **Critical: Always use WSS and HTTPS in production**

### 7.2 Authentication Security

- ✅ **Never trust client identity fields** – Always derive from verified token
- ✅ **Validate tokens server-side** – Use Firebase Admin SDK
- ✅ **Check token expiration** – Firebase tokens expire after ~1 hour
- ✅ **Implement rate limiting** – Prevent abuse of REST endpoints
- ✅ **Validate message size** – Prevent large payload attacks

### 7.3 WebSocket Security

- ✅ **Require authentication** – Reject unauthenticated connections
- ✅ **Implement connection limits** – Prevent DoS attacks
- ✅ **Consider heartbeat/ping** – Detect and close stale connections
- ✅ **Validate all incoming messages** – Check message structure and types

### 7.4 Data Validation

All user inputs must be validated:

- ✅ Message content (max length, allowed characters)
- ✅ User IDs (format validation)
- ✅ Search queries (sanitize against injection)

---

## 8. Complete Message Flow Example

### Scenario: Alice sends a message to Bob

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│  Alice  │                │ Server  │                │   Bob   │
│ Client  │                │         │                │ Client  │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ 1. Type message          │                          │
     │────────┐                 │                          │
     │        │                 │                          │
     │<───────┘                 │                          │
     │                          │                          │
     │ 2. Send via WebSocket    │                          │
     │ {                        │                          │
     │   "type": "message",     │                          │
     │   "to": "bob@...",       │                          │
     │   "message": "Hi Bob!"   │                          │
     │ }                        │                          │
     │─────────────────────────>│                          │
     │                          │                          │
     │                          │ 3. Verify Alice's token  │
     │                          │────────┐                 │
     │                          │        │                 │
     │                          │<───────┘                 │
     │                          │                          │
     │                          │ 4. Save to database      │
     │                          │────────┐                 │
     │                          │        │                 │
     │                          │<───────┘                 │
     │                          │                          │
     │                          │ 5. Check if Bob online   │
     │                          │────────┐                 │
     │                          │        │ YES             │
     │                          │<───────┘                 │
     │                          │                          │
     │                          │ 6. Forward message       │
     │                          │ {                        │
     │                          │   "type": "message",     │
     │                          │   "from": "alice@...",   │
     │                          │   "message": "Hi Bob!"   │
     │                          │ }                        │
     │                          │─────────────────────────>│
     │                          │                          │
     │                          │                          │ 7. Display message
     │                          │                          │────────┐
     │                          │                          │        │
     │                          │                          │<───────┘
     │                          │                          │
```

---

## 9. Summary

### Architecture Overview

| Layer              | Technology                     |
|--------------------|--------------------------------|
| **Authentication** | Firebase Authentication (JWT)  |
| **REST API**       | User search and discovery      |
| **WebSocket**      | Real-time messaging            |
| **Data Format**    | JSON                           |
| **Security**       | JWT tokens + TLS/SSL           |

### Key Endpoints

| Type      | Endpoint        | Purpose              |
|-----------|-----------------|----------------------|
| REST      | `/search-users` | Find users to chat   |
| WebSocket | `/ws`           | Real-time messaging  |

### Message Types

| Type       | Direction        | Purpose                    |
|------------|------------------|----------------------------|
| `login`    | Client → Server  | Authenticate WebSocket     |
| `message`  | Client → Server  | Send chat message          |
| `message`  | Server → Client  | Receive chat message       |
| `history`  | Server → Client  | Load message history       |
| `contacts` | Server → Client  | Load recent conversations  |
| `error`    | Server → Client  | Error notification         |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0     | 2024 | Initial API documentation |

---

## 11. API Contract

This document defines the contract between frontend and backend. 

**Important Notes:**
- ✅ Any changes must maintain backward compatibility
- ✅ Breaking changes must be versioned (e.g., `/api/v2`)
- ✅ Deprecated features should have a sunset timeline
- ✅ Both teams must be notified of any API changes

---

## Appendix A: Quick Reference

### REST Authentication
```http
Authorization: Bearer <Firebase-ID-Token>
```

### WebSocket Login
```json
{"type": "login", "token": "<Firebase-ID-Token>"}
```

### Send Message
```json
{
  "type": "message",
  "to": "user@example.com",
  "message": "Hello!",
  "fromDisplayName": "Your Name"
}
```

### Receive Message
```json
{
  "type": "message",
  "from": "user@example.com",
  "fromDisplayName": "Sender Name",
  "message": "Hello!"
}
```

---

**End of Documentation**

For questions or clarifications, please contact the development team.