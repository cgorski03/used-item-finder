import 'dotenv/config'
import { Buffer } from 'buffer';

const EBAY_PRODUCTION_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const EBAY_SANDBOX_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const CLIENT_CRED_SCOPE = 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/buy.item.bulk';

interface EbayAuthToken {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

interface EbayOAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

function getEnvironmentVariables(): { clientId: string, clientSecret: string, environment: string } {
  if (!process.env.EBAY_APP_ID) {
    throw new Error("EBAY_APP_ID cannot be null")
  }
  if (!process.env.EBAY_CLIENT_SECRET) {
    throw new Error("EBAY_CLIENT_SECRET cannot be null")
  }
  if (!process.env.NODE_ENV) {
    throw new Error("NODE_ENV cannot be null")
  }
  return {
    clientId: process.env.EBAY_APP_ID,
    clientSecret: process.env.EBAY_CLIENT_SECRET,
    environment: process.env.NODE_ENV
  }
}
function encodeCredentials(appId: string, clientSecret: string): string {
  return Buffer.from(
    `${appId}:${clientSecret}`,
  ).toString('base64');

}

function generateApiEndpoint(env: string) {
  if (env === "PRODUCTION") {
    return EBAY_PRODUCTION_URL;
  } return EBAY_SANDBOX_URL;
}

/**
 * Makes a POST request to the eBay OAuth endpoint using async/await and fetch.
 * @param data The URL-encoded request body.
 * @param ebayAuthToken Object containing the client ID, secret, and base URL.
 * @returns A promise that resolves with the parsed OAuth token response.
 */
const getEbayToken = async (
  ebayAuthToken: EbayAuthToken,
): Promise<EbayOAuthResponse> => {
  const encodedStr = encodeCredentials(ebayAuthToken.clientId, ebayAuthToken.clientSecret)
  const auth = `Basic ${encodedStr}`;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: CLIENT_CRED_SCOPE
  })
  try {
    const response = await fetch(ebayAuthToken.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: auth,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      // If the response is not successful, parse the error and throw it
      const errorBody = await response.json();
      throw new Error(
        `eBay OAuth Error: ${errorBody.error || response.statusText}`,
      );
    }

    // Parse the successful JSON response and assert its type
    const responseData = (await response.json()) as EbayOAuthResponse;
    return responseData;
  } catch (error) {
    console.error('Failed to get eBay auth token:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// TODO: future refactor will include making this a class that manages durations
// Time should not be an issue currently. Tokens are valid for two hours
export async function getOAuthToken() {
  // Check Environment Variables
  const { clientId, clientSecret, environment } = getEnvironmentVariables();
  const baseUrl = generateApiEndpoint(environment);
  console.log(baseUrl);
  const accessToken = await getEbayToken({
    clientId,
    clientSecret,
    baseUrl
  })
  return accessToken;
}
