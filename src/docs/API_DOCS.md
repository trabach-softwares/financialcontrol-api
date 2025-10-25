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

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
