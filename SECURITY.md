# Security

This document outlines the security measures implemented in the Financial Control API.

## Authentication & Authorization

### JWT (JSON Web Tokens)
- All authenticated endpoints require a valid JWT token
- Tokens are signed with a secret key (configured via `JWT_SECRET`)
- Default expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Tokens include user ID, email, and role

### Password Security
- Passwords are hashed using bcryptjs with 10 salt rounds
- Plain text passwords are never stored in the database
- Password validation on login compares hashed values

### Role-Based Access Control
- Two roles supported: `user` and `admin`
- Admin-only routes are protected by the `isAdmin` middleware
- Users can only access their own data via RLS policies

## Rate Limiting

Rate limiting is implemented to prevent DoS attacks and brute force attempts:

### Authentication Endpoints (`/api/auth/register`, `/api/auth/login`)
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent brute force attacks and account enumeration
- **Status Code**: 429 (Too Many Requests)

### Admin Endpoints (`/api/admin/*`)
- **Limit**: 50 requests per 15 minutes per IP
- **Purpose**: Protect sensitive administrative operations
- **Status Code**: 429 (Too Many Requests)

### General API Endpoints
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Prevent API abuse and DoS attacks
- **Status Code**: 429 (Too Many Requests)

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests in window
- `RateLimit-Reset`: Time until limit resets (seconds)

## Database Security (Supabase RLS)

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

#### Users Table
- Users can read and update their own profile
- Users cannot change their own role
- Admins can read, update, and delete any user

#### Transactions Table
- Users can only create, read, update, and delete their own transactions
- Admins can view all transactions
- RLS ensures data isolation between users

#### Plans Table
- All users can read active plans (for pricing pages)
- Only admins can create, update, or delete plans

See `DATABASE.md` for complete RLS policy definitions.

## HTTP Security Headers (Helmet)

Helmet middleware adds the following security headers:

- **Content-Security-Policy**: Prevents XSS attacks
- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Cross-Origin-Opener-Policy**: Isolates browsing context

## CORS (Cross-Origin Resource Sharing)

### Development Mode
- All origins allowed for easier testing
- Credentials enabled for cookie support

### Production Mode
- Only specified origins in `ALLOWED_ORIGINS` are allowed
- Origins are validated against the whitelist
- Credentials enabled for authenticated requests
- Requests from non-whitelisted origins are rejected

Configuration:
```env
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

## Input Validation

### Request Body Validation
Controllers validate required fields before processing:
- Email format validation (built-in)
- Password length requirements
- Required field checks
- Type validation

### SQL Injection Prevention
- Supabase client uses parameterized queries
- User input is never directly concatenated into SQL
- RLS policies add an additional layer of protection

## Sensitive Data Protection

### Environment Variables
- All sensitive data stored in environment variables
- `.env` file excluded from version control
- `.env.example` provided as template

### Secrets Management
Never commit:
- Database credentials
- API keys
- JWT secrets
- Service role keys

## Logging & Monitoring

### HTTP Request Logging
- Morgan middleware logs all HTTP requests
- Includes method, URL, status code, and response time
- Helps identify suspicious patterns

### Error Logging
- Errors logged to console in development
- Stack traces only shown in development mode
- Production errors show generic messages to clients

## Best Practices

### For Deployment
1. ✅ Use strong JWT secret (minimum 32 characters)
2. ✅ Enable HTTPS in production
3. ✅ Set `NODE_ENV=production`
4. ✅ Configure `ALLOWED_ORIGINS` restrictively
5. ✅ Use Supabase service role key only when necessary
6. ✅ Enable Supabase RLS policies
7. ✅ Regularly update dependencies
8. ✅ Monitor logs for suspicious activity

### For Development
1. ✅ Never commit `.env` file
2. ✅ Use different secrets for dev and production
3. ✅ Test with rate limiting enabled
4. ✅ Validate all user inputs
5. ✅ Follow principle of least privilege

## Security Checklist

Before deploying to production:

- [ ] Strong JWT secret configured
- [ ] HTTPS enabled
- [ ] ALLOWED_ORIGINS configured
- [ ] Supabase RLS policies applied
- [ ] Database tables have proper indexes
- [ ] Rate limiting tested
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date (no vulnerabilities)
- [ ] Logging configured for production
- [ ] Backup strategy in place

## Vulnerability Reporting

If you discover a security vulnerability, please email: security@yourcompany.com

Do not open a public issue for security vulnerabilities.

## Security Updates

Dependencies are checked for vulnerabilities using:
- GitHub Advisory Database
- npm audit
- Automated security updates

## Compliance

This API implements security measures aligned with:
- OWASP Top 10 best practices
- REST API security guidelines
- JWT best practices
- Database security standards

## Known Limitations

1. **Rate Limiting**: IP-based rate limiting can be bypassed using proxies. For production, consider implementing user-based rate limiting.

2. **Session Management**: Tokens don't support revocation. For immediate revocation needs, implement a token blacklist or use shorter expiration times.

3. **CodeQL Alerts**: Some CodeQL alerts about rate limiting are false positives. Rate limiting is applied at the router level using `router.use(rateLimiter)`, which protects all routes in that router.

## Future Security Enhancements

Recommended improvements for high-scale production:

1. **Token Refresh**: Implement refresh tokens for better security
2. **2FA**: Add two-factor authentication support
3. **API Keys**: Support API key authentication for integrations
4. **Audit Logging**: Log all sensitive operations
5. **IP Whitelisting**: Allow admin operations only from specific IPs
6. **DDoS Protection**: Use Cloudflare or similar service
7. **Intrusion Detection**: Monitor for suspicious patterns
8. **Encrypted Backups**: Encrypt database backups at rest
