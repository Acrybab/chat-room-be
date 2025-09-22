import { getEnvValue } from '../utils/getEnvValue';
const CLIENT_ID = getEnvValue('GOOGLE_CLIENT_ID');
const CLIENT_SECRET = getEnvValue('GOOGLE_CLIENT_SECRET');
const CALLBACK_URL = getEnvValue('CALLBACK_URL');

export const googleOAuthConfig = {
  CLIENT_ID,
  CLIENT_SECRET,
  CALLBACK_URL,
};
