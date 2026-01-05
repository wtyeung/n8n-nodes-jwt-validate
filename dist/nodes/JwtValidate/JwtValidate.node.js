"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtValidate = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
class JwtValidate {
    constructor() {
        this.description = {
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
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    options: [
                        {
                            name: 'Validate',
                            value: 'validate',
                            description: 'Validate JWT signature and claims using JWKS',
                        },
                        {
                            name: 'Decode Only',
                            value: 'decode',
                            description: 'Decode JWT without validation (no signature verification)',
                        },
                    ],
                    default: 'validate',
                    description: 'Whether to validate the JWT or just decode it',
                },
                {
                    displayName: 'JWT Token',
                    name: 'jwtToken',
                    type: 'string',
                    typeOptions: { password: true },
                    default: '',
                    required: true,
                    placeholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
                    description: 'The JWT token to validate or decode',
                },
                {
                    displayName: 'JWKS Configuration',
                    name: 'jwksConfig',
                    type: 'options',
                    displayOptions: {
                        show: {
                            operation: ['validate'],
                        },
                    },
                    options: [
                        {
                            name: 'Auto-Discover From Issuer',
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
                            operation: ['validate'],
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
                    displayOptions: {
                        show: {
                            operation: ['validate'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Check Expiry',
                            name: 'checkExpiry',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to validate the expiration date (exp claim) of the token',
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
                            displayName: 'Required Issuer',
                            name: 'issuer',
                            type: 'string',
                            default: '',
                            placeholder: 'https://example.com',
                            description: 'Expected issuer (iss) claim in the JWT. If not set, issuer validation is skipped.',
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
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const operation = this.getNodeParameter('operation', itemIndex);
                const jwtToken = this.getNodeParameter('jwtToken', itemIndex);
                if (operation === 'decode') {
                    let decoded;
                    try {
                        decoded = jwt.decode(jwtToken, { complete: true });
                        if (!decoded) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid JWT token format', { itemIndex });
                        }
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to decode JWT token: ${errorMessage}`, { itemIndex });
                    }
                    const item = items[itemIndex];
                    returnData.push({
                        json: {
                            ...item.json,
                            jwtHeader: decoded.header,
                            jwtPayload: decoded.payload,
                        },
                        pairedItem: itemIndex,
                    });
                    continue;
                }
                const jwksConfig = this.getNodeParameter('jwksConfig', itemIndex);
                const options = this.getNodeParameter('options', itemIndex, {});
                const issuer = options.issuer || '';
                const audience = options.audience || '';
                const checkExpiry = options.checkExpiry !== undefined ? options.checkExpiry : true;
                const requiredScopes = options.requiredScopes || '';
                const scopeClaimName = options.scopeClaimName || 'scope';
                let decoded;
                try {
                    decoded = jwt.decode(jwtToken, { complete: true });
                    if (!decoded) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid JWT token format', { itemIndex });
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to decode JWT token: ${errorMessage}`, { itemIndex });
                }
                let jwksUrl;
                if (jwksConfig === 'customUrl') {
                    jwksUrl = this.getNodeParameter('jwksUrl', itemIndex);
                    if (!jwksUrl) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'JWKS URL is required when using custom URL configuration', { itemIndex });
                    }
                }
                else {
                    const tokenIssuer = decoded.payload.iss;
                    if (!tokenIssuer) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'JWT token does not contain an issuer (iss) claim for auto-discovery', { itemIndex });
                    }
                    const discoveryUrl = `${tokenIssuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
                    try {
                        const response = await this.helpers.httpRequest({
                            method: 'GET',
                            url: discoveryUrl,
                            json: true,
                        });
                        if (!response.jwks_uri) {
                            throw new n8n_workflow_1.ApplicationError('Discovery document does not contain jwks_uri');
                        }
                        jwksUrl = response.jwks_uri;
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to fetch OpenID Discovery document from ${discoveryUrl}: ${errorMessage}`, { itemIndex });
                    }
                }
                const client = (0, jwks_rsa_1.default)({
                    jwksUri: jwksUrl,
                    cache: true,
                    cacheMaxAge: 600000,
                });
                const kid = decoded.header.kid;
                if (!kid) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'JWT token header does not contain a key ID (kid)', { itemIndex });
                }
                let signingKey;
                try {
                    const key = await client.getSigningKey(kid);
                    signingKey = key.getPublicKey();
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to retrieve signing key from JWKS: ${error.message}. JWKS URL: ${jwksUrl}, Key ID (kid): ${kid}`, { itemIndex });
                }
                const verifyOptions = {
                    ignoreExpiration: !checkExpiry,
                };
                if (issuer) {
                    verifyOptions.issuer = issuer;
                }
                if (audience) {
                    verifyOptions.audience = audience;
                }
                let verifiedPayload;
                try {
                    verifiedPayload = jwt.verify(jwtToken, signingKey, verifyOptions);
                }
                catch (error) {
                    let errorMessage = 'JWT validation failed';
                    if (error instanceof Error) {
                        if (error.name === 'TokenExpiredError') {
                            errorMessage = `JWT token has expired at ${error.expiredAt}`;
                        }
                        else if (error.name === 'JsonWebTokenError') {
                            errorMessage = `JWT validation error: ${error.message}`;
                        }
                        else if (error.name === 'NotBeforeError') {
                            errorMessage = `JWT token is not yet valid (nbf claim)`;
                        }
                        else {
                            errorMessage = `JWT validation failed: ${error.message}`;
                        }
                    }
                    errorMessage += `. JWKS URL: ${jwksUrl}, Key ID (kid): ${kid}`;
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), errorMessage, { itemIndex });
                }
                if (requiredScopes) {
                    const requiredScopesList = requiredScopes.trim().split(/\s+/).filter((s) => s.length > 0);
                    if (requiredScopesList.length > 0) {
                        let tokenScopes = [];
                        if (verifiedPayload[scopeClaimName]) {
                            if (typeof verifiedPayload[scopeClaimName] === 'string') {
                                tokenScopes = verifiedPayload[scopeClaimName].split(/\s+/);
                            }
                            else if (Array.isArray(verifiedPayload[scopeClaimName])) {
                                tokenScopes = verifiedPayload[scopeClaimName];
                            }
                        }
                        else if (verifiedPayload.scopes && Array.isArray(verifiedPayload.scopes)) {
                            tokenScopes = verifiedPayload.scopes;
                        }
                        else if (verifiedPayload.scope) {
                            if (typeof verifiedPayload.scope === 'string') {
                                tokenScopes = verifiedPayload.scope.split(/\s+/);
                            }
                            else if (Array.isArray(verifiedPayload.scope)) {
                                tokenScopes = verifiedPayload.scope;
                            }
                        }
                        const missingScopes = requiredScopesList.filter((requiredScope) => !tokenScopes.includes(requiredScope));
                        if (missingScopes.length > 0) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `JWT token is missing required scopes: ${missingScopes.join(', ')}. Token has scopes: ${tokenScopes.join(', ') || 'none'}`, { itemIndex });
                        }
                    }
                }
                const item = items[itemIndex];
                returnData.push({
                    json: {
                        ...item.json,
                        jwtValid: true,
                        jwtPayload: verifiedPayload,
                    },
                    pairedItem: itemIndex,
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    let kid = 'unknown';
                    let jwksUrl = 'unknown';
                    try {
                        const jwtToken = this.getNodeParameter('jwtToken', itemIndex);
                        const decoded = jwt.decode(jwtToken, { complete: true });
                        if ((_a = decoded === null || decoded === void 0 ? void 0 : decoded.header) === null || _a === void 0 ? void 0 : _a.kid) {
                            kid = decoded.header.kid;
                        }
                        const jwksConfig = this.getNodeParameter('jwksConfig', itemIndex);
                        if (jwksConfig === 'customUrl') {
                            jwksUrl = this.getNodeParameter('jwksUrl', itemIndex) || 'not provided';
                        }
                        else if ((decoded === null || decoded === void 0 ? void 0 : decoded.payload) && typeof decoded.payload === 'object' && 'iss' in decoded.payload && decoded.payload.iss) {
                            const issuer = decoded.payload.iss;
                            jwksUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
                        }
                    }
                    catch {
                    }
                    returnData.push({
                        json: {
                            ...items[itemIndex].json,
                            jwtValid: false,
                            error: error.message,
                            jwksUrl,
                            keyId: kid,
                        },
                        error,
                        pairedItem: itemIndex,
                    });
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.JwtValidate = JwtValidate;
//# sourceMappingURL=JwtValidate.node.js.map