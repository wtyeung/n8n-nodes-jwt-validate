import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class JwtValidate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JWT Validate',
		name: 'jwtValidate',
		icon: 'file:jwt.svg',
		group: ['transform'],
		version: 1,
		description: 'Validate JWT tokens with JWKS support',
		defaults: {
			name: 'JWT Validate',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		properties: [
			{
				displayName: 'JWT Token',
				name: 'jwtToken',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
				description: 'The JWT token to validate',
			},
			{
				displayName: 'JWKS Configuration',
				name: 'jwksConfig',
				type: 'options',
				options: [
					{
						name: 'Auto-Discover from Issuer',
						value: 'autoDiscover',
					},
					{
						name: 'Custom JWKS URL',
						value: 'customUrl',
					},
				],
				default: 'autoDiscover',
				description: 'How to obtain the JWKS for token verification',
			},
			{
				displayName: 'JWKS URL',
				name: 'jwksUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						jwksConfig: ['customUrl'],
					},
				},
				placeholder: 'https://example.com/.well-known/jwks.json',
				description: 'Custom JWKS URL for token verification',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Required Issuer',
						name: 'issuer',
						type: 'string',
						default: '',
						placeholder: 'https://example.com',
						description: 'Expected issuer (iss) claim in the JWT. If not set, issuer validation is skipped.',
					},
					{
						displayName: 'Required Audience',
						name: 'audience',
						type: 'string',
						default: '',
						placeholder: 'your-api-identifier',
						description: 'Expected audience (aud) claim in the JWT. If not set, audience validation is skipped.',
					},
					{
						displayName: 'Check Expiry',
						name: 'checkExpiry',
						type: 'boolean',
						default: true,
						description: 'Whether to validate the expiration date (exp claim) of the token',
					},
					{
						displayName: 'Required Scopes',
						name: 'requiredScopes',
						type: 'string',
						default: '',
						placeholder: 'read:users write:users',
						description: 'Space-separated list of required scopes. Token must contain ALL listed scopes. If not set, scope validation is skipped.',
					},
					{
						displayName: 'Scope Claim Name',
						name: 'scopeClaimName',
						type: 'string',
						default: 'scope',
						description: 'The claim name in the JWT that contains scopes (default: "scope")',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const jwtToken = this.getNodeParameter('jwtToken', itemIndex) as string;
				const jwksConfig = this.getNodeParameter('jwksConfig', itemIndex) as string;
				const options = this.getNodeParameter('options', itemIndex, {}) as {
					issuer?: string;
					audience?: string;
					checkExpiry?: boolean;
					requiredScopes?: string;
					scopeClaimName?: string;
				};

				// Extract options with defaults
				const issuer = options.issuer || '';
				const audience = options.audience || '';
				const checkExpiry = options.checkExpiry !== undefined ? options.checkExpiry : true;
				const requiredScopes = options.requiredScopes || '';
				const scopeClaimName = options.scopeClaimName || 'scope';

				// Decode token without verification to get header and payload
				let decoded: any;
				try {
					decoded = jwt.decode(jwtToken, { complete: true });
					if (!decoded) {
						throw new Error('Invalid JWT token format');
					}
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to decode JWT token: ${error.message}`,
						{ itemIndex },
					);
				}

				// Determine JWKS URL
				let jwksUrl: string;
				if (jwksConfig === 'customUrl') {
					jwksUrl = this.getNodeParameter('jwksUrl', itemIndex) as string;
					if (!jwksUrl) {
						throw new NodeOperationError(
							this.getNode(),
							'JWKS URL is required when using custom URL configuration',
							{ itemIndex },
						);
					}
				} else {
					// Auto-discover from issuer
					const tokenIssuer = decoded.payload.iss;
					if (!tokenIssuer) {
						throw new NodeOperationError(
							this.getNode(),
							'JWT token does not contain an issuer (iss) claim for auto-discovery',
							{ itemIndex },
						);
					}
					jwksUrl = `${tokenIssuer.replace(/\/$/, '')}/discovery/keys`;
				}

				// Get the signing key
				const client = jwksClient({
					jwksUri: jwksUrl,
					cache: true,
					cacheMaxAge: 600000, // 10 minutes
				});

				const kid = decoded.header.kid;
				if (!kid) {
					throw new NodeOperationError(
						this.getNode(),
						'JWT token header does not contain a key ID (kid)',
						{ itemIndex },
					);
				}

				let signingKey: string;
				try {
					const key = await client.getSigningKey(kid);
					signingKey = key.getPublicKey();
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to retrieve signing key from JWKS: ${error.message}`,
						{ itemIndex },
					);
				}

				// Verify the token
				const verifyOptions: jwt.VerifyOptions = {
					ignoreExpiration: !checkExpiry,
				};

				// Add issuer validation if provided
				if (issuer) {
					verifyOptions.issuer = issuer;
				}

				// Add audience validation if provided
				if (audience) {
					verifyOptions.audience = audience;
				}

				let verifiedPayload: any;
				try {
					verifiedPayload = jwt.verify(jwtToken, signingKey, verifyOptions);
				} catch (error) {
					let errorMessage = 'JWT validation failed';
					
					if (error.name === 'TokenExpiredError') {
						errorMessage = `JWT token has expired at ${error.expiredAt}`;
					} else if (error.name === 'JsonWebTokenError') {
						errorMessage = `JWT validation error: ${error.message}`;
					} else if (error.name === 'NotBeforeError') {
						errorMessage = `JWT token is not yet valid (nbf claim)`;
					} else {
						errorMessage = `JWT validation failed: ${error.message}`;
					}

					throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex });
				}

				// Validate scopes if required
				if (requiredScopes) {
					const requiredScopesList = requiredScopes.trim().split(/\s+/).filter((s) => s.length > 0);
					
					if (requiredScopesList.length > 0) {
						// Get scopes from token - can be string or array
						let tokenScopes: string[] = [];
						
						// Check primary claim name (from options)
						if (verifiedPayload[scopeClaimName]) {
							if (typeof verifiedPayload[scopeClaimName] === 'string') {
								tokenScopes = verifiedPayload[scopeClaimName].split(/\s+/);
							} else if (Array.isArray(verifiedPayload[scopeClaimName])) {
								tokenScopes = verifiedPayload[scopeClaimName];
							}
						}
						// Fallback to common alternatives
						else if (verifiedPayload.scopes && Array.isArray(verifiedPayload.scopes)) {
							tokenScopes = verifiedPayload.scopes;
						} else if (verifiedPayload.scope) {
							if (typeof verifiedPayload.scope === 'string') {
								tokenScopes = verifiedPayload.scope.split(/\s+/);
							} else if (Array.isArray(verifiedPayload.scope)) {
								tokenScopes = verifiedPayload.scope;
							}
						}

						// Check if all required scopes are present
						const missingScopes = requiredScopesList.filter(
							(requiredScope: string) => !tokenScopes.includes(requiredScope)
						);

						if (missingScopes.length > 0) {
							throw new NodeOperationError(
								this.getNode(),
								`JWT token is missing required scopes: ${missingScopes.join(', ')}. Token has scopes: ${tokenScopes.join(', ') || 'none'}`,
								{ itemIndex }
							);
						}
					}
				}

				// Token is valid, return the decoded payload
				const item = items[itemIndex];
				returnData.push({
					json: {
						...item.json,
						jwtValid: true,
						jwtPayload: verifiedPayload,
					},
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[itemIndex].json,
							jwtValid: false,
							error: error.message,
						},
						error,
						pairedItem: itemIndex,
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
