import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691d3e1343b421218c68ffb4", 
  requiresAuth: true // Ensure authentication is required for all operations
});
