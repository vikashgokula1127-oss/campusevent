# Campus Event Management

A simple Firebase-hosted campus event system.

## Rules built into the project

- Only the configured Host email can create/update events.
- Participants can create participation/registration records.
- Host can view all participation records.
- Participants can view only their own records.
- Delete is disabled for events and participation records.
- Registration records cannot be edited after creation.

## 1. Firebase setup

Create/use your Firebase project.

Enable:
- Authentication -> Sign-in method -> Email/Password
- Firestore Database

Create the Host account in Authentication -> Users. The default host email in this project is:

`nanigokula45@gmail.com`

If your host email is different, change it in BOTH:
- `app.js` -> `HOST_EMAIL`
- `firestore.rules` -> `isHost()`

## 2. Add Firebase config

Open `firebase-config.js` and replace the placeholder values with the Web App config from:

Firebase Console -> Project settings -> Your apps -> Web app -> Config

## 3. Deploy Firestore rules

Firebase Console -> Firestore Database -> Rules

Replace the existing rules with the contents of `firestore.rules`, then Publish.

## 4. GitHub Pages

Upload all files to your GitHub repository.

For GitHub Pages:
Settings -> Pages -> Deploy from branch -> main -> /(root) -> Save

Important: Firebase config is intentionally kept in a separate file so it is easy to replace.

## Important data behavior

There is no delete button in the application and Firestore rules reject delete requests. Registrations are also locked against update/delete.

For stronger production security, use Firebase custom claims for host roles instead of an email-based host check.
