# JWT Validate Node

This n8n node validates JWT (JSON Web Token) tokens with support for JWKS (JSON Web Key Set) verification.

## Features

- **JWKS Support**: Automatically fetch public keys from JWKS endpoints
- **Auto-Discovery**: Automatically discover JWKS URL from the token's issuer (iss) claim
- **Custom JWKS URL**: Option to provide a custom JWKS URL
- **Issuer Validation**: Verify the token's issuer (iss) claim
- **Audience Validation**: Verify the token's audience (aud) claim
- **Expiry Checking**: Optional validation of token expiration (exp) claim
- **Detailed Error Messages**: Clear error messages indicating validation failure reasons

## Configuration

### JWT Token
The JWT token to validate. Can be provided as a string or from previous node output.

### JWKS Configuration
Choose how to obtain the JWKS for token verification:
- **Auto-Discover from Issuer**: Automatically constructs the JWKS URL by appending `/.well-known/jwks.json` to the issuer claim
- **Custom JWKS URL**: Provide a custom JWKS endpoint URL

### Required Issuer
The expected issuer (iss) claim value in the JWT token.

### Required Audience
The expected audience (aud) claim value in the JWT token.

### Check Expiry
Boolean flag to enable/disable expiration date validation. When enabled, tokens with expired `exp` claims will be rejected.

## Output

On successful validation, the node outputs:
```json
{
  "jwtValid": true,
  "jwtPayload": {
    // Decoded and verified JWT payload
  }
}
```

On validation failure (when "Continue on Fail" is enabled):
```json
{
  "jwtValid": false,
  "error": "Error message describing the failure reason"
}
```

## Error Handling

The node throws descriptive errors for various validation failures:
- Invalid JWT format
- Missing key ID (kid) in token header
- Failed to retrieve signing key from JWKS
- Token expired
- Invalid signature
- Issuer mismatch
- Audience mismatch
- Token not yet valid (nbf claim)

## Example Usage

1. Receive a JWT token from a webhook or previous node
2. Configure the issuer and audience values
3. Choose JWKS configuration method
4. Enable/disable expiry checking as needed
5. The node will validate the token and output the decoded payload on success
