import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { execSync } from 'child_process';

async function main() {
  console.log('Sending request to PWABuilder CloudAPK for «لَمّة» standalone mobile container...');

  const options = {
    additionalTrustedOrigins: [],
    appVersion: "1.2.0",
    appVersionCode: 3,
    backgroundColor: "#1B0C1A",
    display: "standalone",
    enableSiteSettingsShortcut: true,
    enableNotifications: true,
    includeSourceCode: false,
    fallbackType: "webview",
    features: {
      locationDelegation: { enabled: false },
      playBilling: { enabled: false }
    },
    host: "https://family-chat-opal.vercel.app",
    iconUrl: "https://family-chat-opal.vercel.app/icon-512.png",
    launcherName: "لَمّة",
    name: "لَمّة",
    maskableIconUrl: "https://family-chat-opal.vercel.app/icon-512.png",
    navigationColor: "#1B0C1A",
    navigationColorDark: "#0B1421",
    navigationDividerColor: "#2D222F",
    navigationDividerColorDark: "#283041",
    orientation: "portrait",
    packageId: "com.lamma.app",
    pwaUrl: "https://family-chat-opal.vercel.app/",
    shortcuts: [],
    signingMode: "new",
    signing: {
      file: null,
      alias: "lamma-key",
      fullName: "Lamma Family",
      organization: "Lamma",
      organizationalUnit: "Mobile Apps",
      countryCode: "DZ",
      keyPassword: "LammaPass2026!",
      storePassword: "LammaStore2026!"
    },
    splashScreenFadeOutDuration: 300,
    startUrl: "/",
    themeColor: "#1B0C1A",
    themeColorDark: "#0B1421",
    webManifestUrl: "https://family-chat-opal.vercel.app/manifest.json"
  };

  const response = await fetch("https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "platform-identifier": "ServerUI",
      "platform-identifier-version": "1.0.0"
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to enqueue job: ${response.status} ${response.statusText}`, errorText);
    process.exit(1);
  }

  const { id: jobId, accessToken } = await response.json();
  console.log(`Enqueued job ID: ${jobId}`);
  fs.writeFileSync('last-job.json', JSON.stringify({ jobId, accessToken }, null, 2));

  // Polling loop
  let completed = false;
  let attempts = 0;
  const maxAttempts = 60;

  while (!completed && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 3000));
    attempts++;

    const jobRes = await fetch(`https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });

    if (!jobRes.ok) {
      console.warn(`Fetch job returned ${jobRes.status}, retrying...`);
      continue;
    }

    const job = await jobRes.json();
    console.log(`[Attempt ${attempts}] Status: ${job.status}`);
    if (job.logs && job.logs.length > 0) {
      console.log('Latest log:', job.logs[job.logs.length - 1]);
    }

    if (job.status === "Completed") {
      completed = true;
      console.log('Job completed! Fetching download link...');

      let downloadUrl = `https://pwabuilder-cloudapk.azurewebsites.net/downloadPackageZip?id=${encodeURIComponent(jobId)}`;
      let zipRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'manual'
      });

      console.log('Initial download response status:', zipRes.status);
      if (zipRes.status === 301 || zipRes.status === 302 || zipRes.status === 307 || zipRes.status === 308) {
        const location = zipRes.headers.get('location');
        console.log('Redirect location:', location);
        zipRes = await fetch(location);
        console.log('Redirected response status:', zipRes.status);
      }

      if (!zipRes.ok) {
        console.error('Failed to download zip:', zipRes.status, zipRes.statusText);
        process.exit(1);
      }

      console.log('Content-Type:', zipRes.headers.get('content-type'));

      const zipPath = path.resolve('family-chat-package.zip');
      const fileStream = fs.createWriteStream(zipPath);

      await new Promise((resolve, reject) => {
        Readable.fromWeb(zipRes.body)
          .pipe(fileStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      const stats = fs.statSync(zipPath);
      console.log(`Successfully downloaded ${stats.size} bytes to ${zipPath}`);

      // Extract using powershell Expand-Archive
      const extractDir = path.resolve('extracted-package');
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }

      console.log('Extracting package archive...');
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'inherit' });

      // Find APK file
      const files = fs.readdirSync(extractDir);
      const apkName = files.find(f => f.endsWith('.apk'));
      if (!apkName) {
        console.error('No .apk found in extracted directory! Files:', files);
        process.exit(1);
      }

      const apkSource = path.join(extractDir, apkName);
      const publicLammaApk = path.resolve('public', 'lamma.apk');
      const publicFamilyApk = path.resolve('public', 'family-chat.apk');

      fs.copyFileSync(apkSource, publicLammaApk);
      fs.copyFileSync(apkSource, publicFamilyApk);

      const lammaStats = fs.statSync(publicLammaApk);
      console.log(`Successfully generated public/lamma.apk (${lammaStats.size} bytes)`);
      console.log(`Successfully mirrored to public/family-chat.apk`);

      // Copy assetlinks.json
      const assetlinksSource = path.join(extractDir, 'assetlinks.json');
      const wellKnownDir = path.resolve('public', '.well-known');
      if (!fs.existsSync(wellKnownDir)) {
        fs.mkdirSync(wellKnownDir, { recursive: true });
      }
      if (fs.existsSync(assetlinksSource)) {
        fs.copyFileSync(assetlinksSource, path.join(wellKnownDir, 'assetlinks.json'));
        console.log('Successfully updated public/.well-known/assetlinks.json');
      }

      break;
    } else if (job.status === "Failed") {
      console.error('Job failed! Logs:');
      console.error(job.logs?.join('\n'));
      process.exit(1);
    }
  }

  if (!completed) {
    console.error('Timed out waiting for package job.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
