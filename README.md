# TourneyCraft

TourneyCraft is a tournament manager built with Next.js and Firebase.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:9002`.

## Profiles and accounts

Tournament data is saved automatically in the active profile. Profiles are isolated, and backups import or export only the active profile. Signing in with Google syncs all of that account's profiles through Firestore; without an account, profiles remain in this browser.

The Community page allows visitors to browse shared content. Publishing requires a Google account.

## Player development

Player market value and match rating improve gradually from wins and strong score margins, and can fall after losses. A small performance-progress balance is saved with each player and carried across matches; growth slows near the 100-point cap.

## Publish Firestore rules

Vercel does not deploy Firebase security rules. Before using account sync and public community features in production, enable Google in Firebase Authentication, add the Vercel domain to its authorized domains, then sign in to Firebase and publish this repository's rules:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project studio-1848760758-930f1
```
