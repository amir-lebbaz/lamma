# Autonomous Release Workflow (`/release`)

This workflow defines the automated end-to-end release pipeline for «لَمّة» (Lamma). Triggering `/release` updates both the pure native Android app (`lamma.apk`) and the Next.js desktop web platform (`family-chat-opal.vercel.app`).

---

## Prerequisites
- GitHub CLI (`gh`) authenticated with repository write access to `amir-lebbaz/lamma`.
- Vercel CLI (`vercel` or `npx vercel`) linked to `family-chat` project.
- Clean working directory with no untracked unstaged changes.

---

## Step 1: Increment Android Version Code & Version Name
Update `android-app/app/build.gradle.kts`:
- Increment `versionCode` (e.g., `1` -> `2`).
- Update `versionName` (e.g., `"1.0.0"` -> `"1.0.1"`).

```bash
# Verify version code in android-app/app/build.gradle.kts
grep -E "(versionCode|versionName)" android-app/app/build.gradle.kts
```

---

## Step 2: Commit & Push to Main Branch
Stage and commit changes, then push to GitHub to trigger the cloud CI build:

```bash
git add android-app/app/build.gradle.kts
git commit -m "chore(release): bump version to v1.0.x"
git push origin main
```

---

## Step 3: Trigger and Watch GitHub Actions Workflow
Monitor the cloud build until `Assemble & Sign Lamma Native APK` completes successfully:

```bash
# Watch the most recent workflow run
gh run list --workflow=build-android-apk.yml --limit 1
# Replace <RUN_ID> with the current run ID
gh run watch <RUN_ID>
```

---

## Step 4: Download & Verify Native APK Artifact
Download the release artifact, copy it into public download paths, and verify file integrity:

```bash
# Download artifact from GitHub Actions
gh run download <RUN_ID> --name lamma-native-apk --dir temp-apk

# Copy to public download endpoints
cp temp-apk/lamma.apk public/lamma.apk
cp temp-apk/lamma.apk public/family-chat.apk
rm -rf temp-apk

# Verify APK size and magic bytes (504B0304)
ls -lh public/lamma.apk
powershell -Command "[System.BitConverter]::ToString([System.IO.File]::ReadAllBytes('public/lamma.apk')[0..3]) -replace '-',''"
```

---

## Step 5: Deploy Updated Release to Vercel Production
Commit the compiled APK binaries and trigger production deployment:

```bash
git add public/lamma.apk public/family-chat.apk
git commit -m "build(release): update production apk binaries"
git push origin main

# Deploy to Vercel production
npx vercel deploy --prod --yes
```

---

## Step 6: Verify Production Endpoints
Ensure both the web application and APK download routes return HTTP 200:

```bash
curl -I https://family-chat-opal.vercel.app/
curl -I https://family-chat-opal.vercel.app/lamma.apk
```
