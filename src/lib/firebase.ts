import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const remoteConfig = getRemoteConfig(app);

// Set fetch interval to 0 for development, default (12 hours) for production
remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 0 : 43200000;

export const getRemoteConfigValue = async (key: string) => {
  try {
    const activated = await fetchAndActivate(remoteConfig);
    console.log(`🔄 Remote Config fetch result for "${key}":`, activated ? 'Activated' : 'No change');
    
    const val = getValue(remoteConfig, key);
    const stringValue = val.asString();
    const source = val.getSource(); // 'remote', 'default', or 'static'
    
    console.log(`📦 Remote Config value for "${key}":`, {
      value: stringValue || '(empty)',
      source: source,
      hasValue: !!stringValue
    });
    
    return stringValue;
  } catch (error) {
    console.error(`Error fetching remote config for key ${key}:`, error);
    return "";
  }
};

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      // Perform any other neccessary action with the token
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
