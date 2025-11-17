# JWT Validate Node - Usage Examples

## Example 1: Validate JWT from Webhook with Auto-Discovery

This example shows how to validate a JWT token received from a webhook, automatically discovering the JWKS URL from the issuer.

**Configuration:**
- **JWT Token**: `{{ $json.headers.authorization.replace('Bearer ', '') }}`
- **JWKS Configuration**: Auto-Discover from Issuer
- **Required Issuer**: `https://auth.example.com`
- **Required Audience**: `api://default`
- **Check Expiry**: `true`

**Workflow:**
1. Webhook receives request with JWT in Authorization header
2. JWT Validate node extracts and validates the token
3. On success, workflow continues with validated user info

## Example 2: Validate JWT with Custom JWKS URL

This example uses a custom JWKS URL instead of auto-discovery.

**Configuration:**
- **JWT Token**: `{{ $json.token }}`
- **JWKS Configuration**: Custom JWKS URL
- **JWKS URL**: `https://auth.example.com/.well-known/jwks.json`
- **Required Issuer**: `https://auth.example.com`
- **Required Audience**: `my-api`
- **Check Expiry**: `true`

## Example 3: Validate JWT Without Expiry Check

This example validates a JWT token but skips expiration checking (useful for testing or specific use cases).

**Configuration:**
- **JWT Token**: `{{ $json.jwt }}`
- **JWKS Configuration**: Auto-Discover from Issuer
- **Required Issuer**: `https://auth.example.com`
- **Required Audience**: `test-api`
- **Check Expiry**: `false`

## Example 4: Handle Validation Errors Gracefully

Enable "Continue on Fail" in the node settings to handle validation errors without stopping the workflow.

**Configuration:**
- Enable "Continue on Fail" in node settings
- Configure validation parameters as needed

**Output on Success:**
```json
{
  "jwtValid": true,
  "jwtPayload": {
    "iss": "https://auth.example.com",
    "aud": "api://default",
    "sub": "user-123",
    "exp": 1700000000,
    "iat": 1699999000,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Output on Failure:**
```json
{
  "jwtValid": false,
  "error": "JWT token has expired at 2023-11-14T12:00:00.000Z"
}
```

## Example 5: Extract User Info from Validated JWT

After validation, use the decoded payload to extract user information.

**Workflow:**
1. JWT Validate node validates the token
2. Set node extracts specific claims: `{{ $json.jwtPayload.sub }}`, `{{ $json.jwtPayload.email }}`
3. Use extracted data in subsequent nodes

## Common Use Cases

### API Gateway Pattern
Validate incoming JWT tokens before processing API requests:
- Webhook → JWT Validate → Process Request → Return Response

### User Authentication Flow
Verify user identity from JWT tokens:
- Receive JWT → JWT Validate → Fetch User Data → Return User Profile

### Microservice Authorization
Validate tokens between microservices:
- Service A → HTTP Request with JWT → JWT Validate → Service B Logic

### Token Refresh Check
Validate tokens and check if they need refreshing:
- JWT Validate → Check Expiry Time → Refresh if Needed → Continue

## Error Handling Best Practices

1. **Enable Continue on Fail**: For production workflows, enable this to handle errors gracefully
2. **Check jwtValid Flag**: Always check the `jwtValid` field before processing
3. **Log Errors**: Use a logging node to track validation failures
4. **Implement Fallbacks**: Have alternative paths for failed validations

## Security Best Practices

1. **Always Validate Issuer**: Never skip issuer validation
2. **Always Validate Audience**: Ensure tokens are intended for your API
3. **Enable Expiry Checking**: Unless you have a specific reason not to
4. **Use HTTPS**: Ensure JWKS URLs use HTTPS
5. **Keep Dependencies Updated**: Regularly update the node package

## Troubleshooting

### "Failed to retrieve signing key from JWKS"
- Verify the JWKS URL is correct and accessible
- Check if the token's `kid` (key ID) exists in the JWKS
- Ensure the JWKS endpoint is responding correctly

### "JWT token does not contain an issuer (iss) claim"
- The token is missing the `iss` claim
- Use Custom JWKS URL option instead of auto-discovery

### "JWT validation error: invalid signature"
- The token was signed with a different key
- Verify you're using the correct JWKS URL
- Check if the token is from the expected issuer

### "JWT token has expired"
- The token's `exp` claim is in the past
- Request a new token
- Or disable expiry checking if appropriate for your use case
