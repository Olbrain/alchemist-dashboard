/**
 * Firebase Stub for Embed Mode
 *
 * This is a whitelabel embed build that uses backend APIs only.
 * Firebase is not used - authentication is provided by the host application
 * via DashboardProvider.
 *
 * This file exports proxy objects that throw detailed errors to help identify
 * any remaining Firestore usage.
 */

// Import collection constants (these don't depend on Firebase)
import { Collections, DocumentFields, StatusValues, ErrorMessages, validateCollectionUsage } from '../constants/collections';

console.log("🔌 Embed Mode: Firebase completely disabled");
console.log("📝 Using backend APIs only - authentication via DashboardProvider");

// Create a proxy that throws detailed errors when accessed
const createFirebaseProxy = (name) => {
  return new Proxy({}, {
    get(target, prop) {
      const error = new Error(
        `\n\n🚫 FIREBASE BLOCKED in Embed Mode\n` +
        `   Attempted to access: ${name}.${String(prop)}\n` +
        `   This file is trying to use Firestore directly.\n` +
        `   Please update it to use DataAccess layer instead.\n`
      );
      console.error(error);
      throw error;
    }
  });
};

// Export proxy objects that will show exactly where Firestore is being used
export const app = null;
export const auth = null;
export const storage = null;
export const db = createFirebaseProxy('db');  // This will show which file tries to use db
export const functions = null;
export const appCheck = null;

// Export serverTimestamp as null (not used in embed mode)
export const serverTimestamp = null;

// Export collection constants (still needed for backend API calls)
export { Collections, DocumentFields, StatusValues, ErrorMessages, validateCollectionUsage };
