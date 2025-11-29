// API client utility for making authenticated requests with Privy
import { User } from '@privy-io/react-auth';

export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  user?: User
) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Privy user ID to headers for server-side auth verification
  if (user?.id) {
    headers['x-privy-user-id'] = user.id;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function apiGet(url: string, user?: User) {
  return makeAuthenticatedRequest(url, { method: 'GET' }, user);
}

export async function apiPost(url: string, data: any, user?: User) {
  return makeAuthenticatedRequest(
    url,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    user
  );
}

export async function apiPut(url: string, data: any, user?: User) {
  return makeAuthenticatedRequest(
    url,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    user
  );
}

export async function apiDelete(url: string, user?: User) {
  return makeAuthenticatedRequest(url, { method: 'DELETE' }, user);
}


