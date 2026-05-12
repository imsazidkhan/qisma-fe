import { expo } from '@hot-updater/expo';
import { defineConfig } from 'hot-updater';

/**
 * OTA build pipeline for Expo. To enable a self-hosted provider, add `database` and `storage`
 * targets here per https://hot-updater.dev/docs (Firebase, AWS S3 + CloudFront, etc.).
 *
 * Example (Firebase Storage + Firestore):
 *   import { firebaseDatabase, firebaseStorage } from '@hot-updater/firebase';
 *   database: firebaseDatabase({ projectId: process.env.FIREBASE_PROJECT_ID! }),
 *   storage:  firebaseStorage({ projectId: process.env.FIREBASE_PROJECT_ID!,
 *                               storageBucket: process.env.FIREBASE_STORAGE_BUCKET! }),
 *
 * Example (AWS):
 *   import { dynamoDb, s3Storage } from '@hot-updater/aws';
 *   database: dynamoDb({ region: process.env.AWS_REGION!, tableName: 'qisma-bundles' }),
 *   storage:  s3Storage({ region: process.env.AWS_REGION!, bucketName: 'qisma-ota' }),
 */
export default defineConfig({
  build: expo({
    sourcemap: true,
    resetCache: true,
  }),
});
