# n8n-nodes-jwt-validate

This is an n8n community node that provides JWT (JSON Web Token) validation with JWKS (JSON Web Key Set) support for your n8n workflows.

JWT validation is essential for securing API workflows and verifying authentication tokens. This node validates JWT tokens by verifying their signature using public keys from JWKS endpoints, and validates claims like issuer, audience, and expiration.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) • [Features](#features) • [Configuration](#configuration) • [Usage](#usage) • [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Alternatively, install via npm:

```bash
npm install n8n-nodes-jwt-validate
```

## Features

- **JWKS Support**: Automatically fetch and cache public keys from JWKS endpoints
- **Auto-Discovery**: Automatically discover JWKS URL from the token's issuer claim by appending `/.well-known/jwks.json`
- **Custom JWKS URL**: Option to provide a custom JWKS endpoint URL
- **Issuer Validation**: Verify the token's issuer (iss) claim matches expected value
- **Audience Validation**: Verify the token's audience (aud) claim matches expected value
- **Expiry Checking**: Optional validation of token expiration (exp) claim
- **Detailed Error Messages**: Clear error messages indicating specific validation failure reasons
- **Continue on Fail**: Option to continue workflow execution even if validation fails

## Configuration

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| JWT Token | String | Yes | The JWT token to validate |
| JWKS Configuration | Options | Yes | Choose "Auto-Discover from Issuer" or "Custom JWKS URL" |
| JWKS URL | String | Conditional | Required when using "Custom JWKS URL" option |
| Required Issuer | String | Yes | Expected issuer (iss) claim value |
| Required Audience | String | Yes | Expected audience (aud) claim value |
| Check Expiry | Boolean | No | Enable/disable expiration validation (default: true) |

## Usage

### Basic Example

1. Add the JWT Validate node to your workflow
2. Configure the JWT token (from webhook, previous node, or expression)
3. Set the required issuer (e.g., `https://auth.example.com`)
4. Set the required audience (e.g., `your-api-identifier`)
5. Choose JWKS configuration method
6. The node outputs the validated JWT payload on success

### Output

**On Success:**
```json
{
  "jwtValid": true,
  "jwtPayload": {
    "iss": "https://auth.example.com",
    "aud": "your-api-identifier",
    "sub": "user123",
    "exp": 1234567890,
    // ... other claims
  }
}
```

**On Failure (with Continue on Fail enabled):**
```json
{
  "jwtValid": false,
  "error": "JWT token has expired at 2024-01-01T00:00:00.000Z"
}
```

### Error Messages

The node provides specific error messages for different validation failures:
- Invalid JWT format
- Missing key ID (kid) in token header
- Failed to retrieve signing key from JWKS
- Token expired
- Invalid signature
- Issuer mismatch
- Audience mismatch
- Token not yet valid (nbf claim)

## Credentials

This node does not require credentials. It validates JWT tokens using public keys from JWKS endpoints.

## Compatibility

Tested with n8n version 1.0.0 and above.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [JWT.io](https://jwt.io/) - Learn about JSON Web Tokens
* [JWKS Specification](https://datatracker.ietf.org/doc/html/rfc7517)

## Version history

### 0.1.0
- Initial release
- JWT validation with JWKS support
- Auto-discovery of JWKS from issuer
- Custom JWKS URL option
- Issuer and audience validation
- Optional expiry checking
