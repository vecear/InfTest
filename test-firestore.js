const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
    console.log("Testing Comments query (ASC)...");
    try {
        const snapshot = await db.collection("comments")
            .where("questionId", "==", "test-q")
            .orderBy("createdAt", "asc")
            .get();
        console.log("Comments query successful!");
    } catch (e) {
        console.error("Comments query failed:");
        console.error(e.message);
    }
}

test();
