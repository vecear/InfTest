import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        // In some environments, we might use service account file
        try {
            const serviceAccount = require("../../service-account.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialized with service account file");
        } catch (fileError) {
            // Fallback to default credentials (works in Firebase/GCP environments)
            admin.initializeApp();
            console.log("Firebase Admin initialized with default credentials");
        }
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
