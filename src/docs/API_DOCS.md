# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Response Format

All endpoints return JSON in the following format:

### Success Response
```json
{
  "success": true,
  "data": {}, // Response data
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Error message"
}
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Auth Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "João Silva",
      "role": "user"
    },
    "token": "jwt_token"
  },
  "message": "User registered successfully"
}
```

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "João Silva",
      "role": "user"
    },
    "token": "jwt_token"
  },
  "message": "Login successful"
}
```

### Get Current User
**GET** `/auth/me`

Get authenticated user information.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    }
  },
  "message": "User data retrieved successfully"
}
```

---

## Transaction Endpoints

All transaction endpoints require authentication.

### Create Transaction
**POST** `/transactions`

Create a new transaction (income or expense).

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "type": "income", // or "expense"
  "amount": 1500.00,
  "description": "Salário mensal",
  "category": "Trabalho",
  "date": "2024-01-15T10:00:00Z" // optional, defaults to now
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "income",
    "amount": "1500.00",
    "description": "Salário mensal",
    "category": "Trabalho",
    "date": "2024-01-15T10:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Transaction created successfully"
}
```

### List Transactions
**GET** `/transactions`

Get all transactions for authenticated user with optional filters.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `type` (optional): Filter by type ("income" or "expense")
- `category` (optional): Filter by category
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Example:**
```
GET /transactions?type=income&startDate=2024-01-01&endDate=2024-12-31
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "income",
      "amount": "1500.00",
      "description": "Salário",
      "category": "Trabalho",
      "date": "2024-01-15T10:00:00Z"
    }
  ],
  "message": "Transactions retrieved successfully"
}
```

### Get Transaction by ID
**GET** `/transactions/:id`

Get a specific transaction.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "income",
    "amount": "1500.00",
    "description": "Salário",
    "category": "Trabalho",
    "date": "2024-01-15T10:00:00Z"
  },
  "message": "Transaction retrieved successfully"
}
```

### Update Transaction
**PUT** `/transactions/:id`

Update an existing transaction.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:** (all fields optional)
```json
{
  "type": "expense",
  "amount": 500.00,
  "description": "Compras",
  "category": "Alimentação",
  "date": "2024-01-16T10:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "expense",
    "amount": "500.00",
    "description": "Compras",
    "category": "Alimentação",
    "date": "2024-01-16T10:00:00Z"
  },
  "message": "Transaction updated successfully"
}
```

### Delete Transaction
**DELETE** `/transactions/:id`

Delete a transaction.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Transaction deleted successfully"
}
```

### Get Statistics
**GET** `/transactions/stats`

Get financial statistics for authenticated user.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "income": 5000.00,
    "expense": 2500.00,
    "balance": 2500.00,
    "totalTransactions": 15
  },
  "message": "Statistics retrieved successfully"
}
```

---

## User Endpoints

All user endpoints require authentication.

### Get Profile
**GET** `/users/profile`

Get user profile information.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "user",
    "plan_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Profile retrieved successfully"
}
```

### Update Profile
**PUT** `/users/profile`

Update user profile.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "name": "João Silva Santos",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newemail@example.com",
    "name": "João Silva Santos",
    "role": "user",
    "plan_id": "uuid"
  },
  "message": "Profile updated successfully"
}
```

### Change Password
**PUT** `/users/password`

Change user password.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

### Update Plan
**PUT** `/users/plan`

Update user subscription plan.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "planId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "user",
    "plan_id": "uuid"
  },
  "message": "Plan updated successfully"
}
```

---

## Plan Endpoints

### List Plans
**GET** `/plans`

Get all available plans (public endpoint).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Free",
      "description": "Plano gratuito",
      "price": "0.00",
      "features": ["100 transações/mês"],
      "max_transactions": 100,
      "is_active": true
    },
    {
      "id": "uuid",
      "name": "Pro",
      "description": "Plano profissional",
      "price": "29.90",
      "features": ["Transações ilimitadas", "Relatórios avançados"],
      "max_transactions": null,
      "is_active": true
    }
  ],
  "message": "Plans retrieved successfully"
}
```

### Get Plan by ID
**GET** `/plans/:id`

Get a specific plan (public endpoint).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Pro",
    "description": "Plano profissional",
    "price": "29.90",
    "features": ["Transações ilimitadas"],
    "max_transactions": null,
    "is_active": true
  },
  "message": "Plan retrieved successfully"
}
```

### Create Plan (Admin Only)
**POST** `/plans`

Create a new plan.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Request Body:**
```json
{
  "name": "Enterprise",
  "description": "Plano empresarial",
  "price": 99.90,
  "features": ["Transações ilimitadas", "Suporte prioritário"],
  "max_transactions": null,
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Enterprise",
    "description": "Plano empresarial",
    "price": "99.90",
    "features": ["Transações ilimitadas", "Suporte prioritário"],
    "max_transactions": null,
    "is_active": true
  },
  "message": "Plan created successfully"
}
```

### Update Plan (Admin Only)
**PUT** `/plans/:id`

Update an existing plan.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Request Body:** (all fields optional)
```json
{
  "name": "Enterprise Plus",
  "price": 149.90,
  "is_active": true
}
```

**Response:** `200 OK`

### Delete Plan (Admin Only)
**DELETE** `/plans/:id`

Delete a plan.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Plan deleted successfully"
}
```

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### List All Users
**GET** `/admin/users`

Get all users with optional filters.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Query Parameters:**
- `role` (optional): Filter by role
- `plan_id` (optional): Filter by plan

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "João Silva",
      "role": "user",
      "plan_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

### Get User by ID
**GET** `/admin/users/:id`

Get a specific user.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Response:** `200 OK`

### Update User Role
**PUT** `/admin/users/:id/role`

Update a user's role.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Request Body:**
```json
{
  "role": "admin" // or "user"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "admin",
    "plan_id": "uuid"
  },
  "message": "User role updated successfully"
}
```

### Delete User
**DELETE** `/admin/users/:id`

Delete a user and all their transactions.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully"
}
```

### Get Statistics
**GET** `/admin/stats`

Get platform statistics.

**Headers:** `Authorization: Bearer TOKEN` (admin role required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalTransactions": 5000,
    "usersByPlan": {
      "free": 100,
      "pro": 40,
      "enterprise": 10
    }
  },
  "message": "Statistics retrieved successfully"
}
```

---

## Payment Endpoints (Asaas Integration)

### Create Payment
**POST** `/payments`

Create a new payment for a plan subscription.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body (PIX or Boleto):**
```json
{
  "planId": "uuid-do-plano",
  "paymentMethod": "PIX"  // or "BOLETO"
}
```

**Request Body (Credit Card):**
```json
{
  "planId": "uuid-do-plano",
  "paymentMethod": "CREDIT_CARD",
  "creditCard": {
    "number": "1234 5678 9012 3456",
    "holderName": "João Silva",
    "expiryDate": "12/2025",
    "cvv": "123"
  }
}
```

**Response (PIX):** `201 Created`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "PENDING",
      "value": 99.90,
      "dueDate": "2025-01-10T23:59:59Z",
      "invoiceUrl": "https://www.asaas.com/i/abc123"
    },
    "pix": {
      "qrCodeImage": "data:image/png;base64,iVBORw0KG...",
      "payload": "00020126580014br.gov.bcb.pix...",
      "expiresAt": "2025-01-05T12:00:00Z"
    }
  },
  "message": "Pagamento criado com sucesso"
}
```

**Response (Boleto):** `201 Created`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "PENDING",
      "value": 99.90,
      "dueDate": "2025-01-10T23:59:59Z"
    },
    "boleto": {
      "pdfUrl": "https://www.asaas.com/b/pdf/abc123",
      "barcode": "34191.79001 01043.510047 91020.150008 1 84430000002000",
      "bankSlipUrl": "https://www.asaas.com/b/abc123"
    }
  },
  "message": "Pagamento criado com sucesso"
}
```

**Response (Credit Card Approved):** `201 Created`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "RECEIVED",
      "value": 99.90,
      "confirmedDate": "2025-01-04T10:30:00Z",
      "transactionReceiptUrl": "https://www.asaas.com/r/abc123"
    }
  },
  "message": "Pagamento criado com sucesso"
}
```

### Get Payment Status
**GET** `/payments/:paymentId`

Retrieve the current status of a payment.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "RECEIVED",
      "value": 99.90,
      "paidAt": "2025-01-04T10:30:00Z",
      "confirmedDate": "2025-01-04T10:30:00Z"
    }
  }
}
```

**Payment Status Values:**
- `PENDING` - Awaiting payment
- `RECEIVED` - Payment received
- `CONFIRMED` - Payment confirmed
- `OVERDUE` - Payment overdue
- `CANCELLED` - Payment cancelled
- `REFUNDED` - Payment refunded

### Get PIX QR Code
**GET** `/payments/:paymentId/pix`

Get the PIX QR Code for a payment.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "qrCodeImage": "data:image/png;base64,iVBORw0KG...",
    "payload": "00020126580014br.gov.bcb.pix...",
    "expiresAt": "2025-01-05T12:00:00Z"
  }
}
```

### List User Payments
**GET** `/payments`

List all payments for the authenticated user.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters (optional):**
- `status` - Filter by status (PENDING, RECEIVED, CONFIRMED, etc.)
- `limit` - Number of results (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)

**Example:** `/payments?status=PENDING&limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "pay_abc123",
      "planName": "Pro",
      "value": 99.90,
      "status": "RECEIVED",
      "paymentMethod": "PIX",
      "createdAt": "2025-01-04T09:00:00Z",
      "paidAt": "2025-01-04T10:30:00Z"
    }
  ]
}
```

### Cancel Payment
**DELETE** `/payments/:paymentId`

Cancel a pending payment.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Pagamento cancelado com sucesso"
}
```

**Note:** Only payments with status `PENDING` can be cancelled.

### Asaas Webhook (Internal)
**POST** `/webhooks/asaas`

Endpoint to receive payment notifications from Asaas.

**Headers:**
- `X-Asaas-Signature` or `asaas-access-token` - Webhook signature

**Request Body:**
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "customer": "cus_xyz789",
    "value": 99.90,
    "netValue": 98.91,
    "status": "RECEIVED",
    "billingType": "PIX",
    "confirmedDate": "2025-01-04T10:30:00.000Z",
    "externalReference": "user-uuid-here"
  }
}
```

**Response:** `200 OK`
```json
{
  "received": true
}
```

**Webhook Events:**
- `PAYMENT_RECEIVED` - Payment received
- `PAYMENT_CONFIRMED` - Payment confirmed
- `PAYMENT_OVERDUE` - Payment overdue
- `PAYMENT_DELETED` - Payment cancelled
- `PAYMENT_REFUNDED` - Payment refunded

---

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
