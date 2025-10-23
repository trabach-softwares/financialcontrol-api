# API Documentation

Financial Control API - RESTful API for managing personal finances.

## Base URL

```
http://localhost:3000
```

## Response Format

All endpoints return a standardized JSON response:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token"
  },
  "message": "User registered successfully"
}
```

### POST /api/auth/login

Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token"
  },
  "message": "Login successful"
}
```

### GET /api/auth/profile

Get current user profile.

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "plan_id": "uuid"
  },
  "message": "Profile retrieved successfully"
}
```

---

## Transaction Endpoints

All transaction endpoints require authentication.

### POST /api/transactions

Create a new transaction.

**Request Body:**
```json
{
  "type": "income",
  "amount": 1500.00,
  "category": "Salary",
  "description": "Monthly salary",
  "date": "2025-10-23"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "income",
    "amount": "1500.00",
    "category": "Salary",
    "description": "Monthly salary",
    "date": "2025-10-23",
    "created_at": "timestamp"
  },
  "message": "Transaction created successfully"
}
```

### GET /api/transactions

Get all transactions for the authenticated user.

**Query Parameters:**
- `type` (optional): Filter by type (income/expense)
- `category` (optional): Filter by category
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "income",
      "amount": "1500.00",
      "category": "Salary",
      "date": "2025-10-23"
    }
  ],
  "message": "Transactions retrieved successfully"
}
```

### GET /api/transactions/summary

Get financial summary (total income, total expenses, balance).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 3000.00,
    "totalExpense": 1200.00,
    "balance": 1800.00
  },
  "message": "Summary retrieved successfully"
}
```

### GET /api/transactions/:id

Get a specific transaction by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "expense",
    "amount": "50.00",
    "category": "Food",
    "description": "Grocery shopping",
    "date": "2025-10-23"
  },
  "message": "Transaction retrieved successfully"
}
```

### PUT /api/transactions/:id

Update a transaction.

**Request Body:**
```json
{
  "amount": 75.00,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Transaction updated successfully"
}
```

### DELETE /api/transactions/:id

Delete a transaction.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Transaction deleted successfully"
}
```

---

## User Endpoints

### GET /api/users (Admin only)

Get all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  ],
  "message": "Users retrieved successfully"
}
```

### GET /api/users/:id

Get a specific user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "message": "User retrieved successfully"
}
```

### PUT /api/users/profile

Update current user profile.

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "User updated successfully"
}
```

### PUT /api/users/password

Change password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Password updated successfully"
}
```

### DELETE /api/users/profile

Delete current user account.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully"
}
```

---

## Plans Endpoints

### GET /api/plans

Get all available plans (public).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Free",
      "description": "Basic financial control",
      "price": "0.00",
      "features": ["Up to 50 transactions/month"]
    }
  ],
  "message": "Plans retrieved successfully"
}
```

### GET /api/plans/:id

Get a specific plan by ID (public).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Premium",
    "price": "9.99"
  },
  "message": "Plan retrieved successfully"
}
```

### POST /api/plans/subscribe

Subscribe to a plan (requires authentication).

**Request Body:**
```json
{
  "planId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Subscribed to plan successfully"
}
```

### POST /api/plans (Admin only)

Create a new plan.

**Request Body:**
```json
{
  "name": "Enterprise",
  "description": "For large organizations",
  "price": 99.99,
  "features": ["Unlimited everything"]
}
```

### PUT /api/plans/:id (Admin only)

Update a plan.

### DELETE /api/plans/:id (Admin only)

Delete a plan.

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### GET /api/admin/users

Get all users (admin view).

### PUT /api/admin/users/:id/role

Update user role.

**Request Body:**
```json
{
  "role": "admin"
}
```

### DELETE /api/admin/users/:id

Delete a user.

### GET /api/admin/stats

Get system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalTransactions": 5000,
    "totalPlans": 3
  },
  "message": "System stats retrieved successfully"
}
```

### GET /api/admin/transactions

Get all transactions (admin view with user info).

---

## Error Responses

All errors follow the same format:

```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address

---

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days (configurable)
- CORS is configured for allowed origins
- Helmet.js for security headers
- Row Level Security (RLS) in Supabase
