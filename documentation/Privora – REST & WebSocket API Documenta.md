Privora – REST & WebSocket API Documentation

1. Introduction

This document describes all APIs used by the Privora chat application.
It is intended for engineers who need to:

-   Implement or maintain the REST API
-   Implement or maintain the WebSocket server
-   Understand frontend expectations and message contracts
-   Ensure authentication and security compatibility

The frontend is built in React and communicates with the backend
using: - HTTP REST APIs (JSON) - WebSocket APIs (JSON messages)

Authentication is handled using Firebase Authentication.

------------------------------------------------------------------------

2. Authentication & Security Model

2.1 Authentication Provider

-   Provider: Firebase Authentication
-   Token Type: Firebase ID Token (JWT)
-   Token Storage: Browser localStorage
-   Token Lifetime: ~1 hour (auto-refreshed by Firebase SDK)

2.2 Token Usage

The Firebase ID Token is: - Sent as a Bearer token for REST requests -
Sent during WebSocket login handshake - Verified server-side using
Firebase Admin SDK

⚠️ Backend MUST NOT trust client-provided user identifiers. Always
derive user identity from the verified token.

------------------------------------------------------------------------

3. REST API

3.1 Base URL

    http://localhost:8080

Production environments should use HTTPS.

------------------------------------------------------------------------

3.2 Search Users API

Endpoint

    GET /search-users

Purpose

Allows users to search for other registered users in order to: - Start a
new chat - Add users to recent chats

Query Parameters

  Name   Type     Required   Description
  ------ -------- ---------- -----------------------------
  q      string   yes        Search term (name or email)

Headers

    Authorization: Bearer <Firebase-ID-Token>
    Content-Type: application/json

Example Request

    GET /search-users?q=ali

Example Response (200 OK)

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

Error Responses

  Status   Reason
  -------- --------------------------
  400      Missing or empty query
  401      Invalid or missing token
  500      Internal server error

Backend Notes

-   Results should be limited (e.g. max 10)
-   Should exclude the requesting user
-   Should be case-insensitive
-   Partial matches supported

------------------------------------------------------------------------

4. WebSocket API

4.1 Connection URL

    ws://<host>/ws
    wss://<host>/ws (production)

4.2 Connection Lifecycle

1.  Client opens WebSocket connection
2.  Client sends login message
3.  Server validates token
4.  Server associates socket with authenticated user
5.  Server begins routing messages

------------------------------------------------------------------------

4.3 WebSocket Authentication Message

Client → Server

    {
      "type": "login",
      "token": "<Firebase-ID-Token>"
    }

Server Behavior

-   Verify token using Firebase Admin SDK
-   Extract:
    -   userId (email or UID)
    -   displayName
-   Bind socket to authenticated user
-   Reject connection if token invalid

------------------------------------------------------------------------

4.4 Chat Message (Client → Server)

Payload

    {
      "type": "message",
      "to": "recipient@example.com",
      "message": "Hello there!",
      "fromDisplayName": "John Doe"
    }

Field Definitions

  Field             Description
  ----------------- ---------------------------
  type              Must be message
  to                Recipient user identifier
  message           Message body
  fromDisplayName   UI display name only

⚠️ Backend must ignore fromDisplayName for identity validation.

------------------------------------------------------------------------

4.5 Chat Message (Server → Client)

    {
      "type": "message",
      "from": "alice@example.com",
      "fromDisplayName": "Alice",
      "message": "Hello!"
    }

Backend Responsibilities

-   Validate sender identity
-   Persist message (if history is supported)
-   Forward to recipient if online
-   Optionally store for offline delivery

------------------------------------------------------------------------

4.6 Message History Payload (Optional)

    {
      "type": "history",
      "messages": [
        {
          "from": "alice@example.com",
          "message": "Hi",
          "timestamp": 1712345678
        }
      ]
    }

Sent after login or chat selection.

------------------------------------------------------------------------

4.7 Contacts / Recent Chats Payload (Optional)

    {
      "type": "contacts",
      "contacts": [
        {
          "userId": "bob@example.com",
          "displayName": "Bob"
        }
      ]
    }

Used to populate the sidebar.

------------------------------------------------------------------------

5. Error Handling

WebSocket Error Message (Recommended)

    {
      "type": "error",
      "message": "Unauthorized"
    }

Possible Error Reasons

-   Invalid token
-   User not found
-   Recipient offline
-   Internal server error

------------------------------------------------------------------------

6. Environment Variables

Frontend

    REACT_APP_API_URL=http://localhost:8080
    REACT_APP_WS_URL=ws://localhost:8080/ws

Backend

    FIREBASE_PROJECT_ID=...
    FIREBASE_PRIVATE_KEY=...
    FIREBASE_CLIENT_EMAIL=...

------------------------------------------------------------------------

7. Security Considerations

-   Always use WSS in production
-   Never trust client identity fields
-   Rate-limit REST endpoints
-   Consider WebSocket heartbeat/ping
-   Validate message size limits

------------------------------------------------------------------------

8. Summary

  Layer       Technology
  ----------- -------------------------
  Auth        Firebase Authentication
  REST        User discovery
  WebSocket   Real-time messaging
  Format      JSON
  Security    JWT + TLS

This document defines the contract between frontend and backend. Any
changes must maintain backward compatibility or be versioned.
