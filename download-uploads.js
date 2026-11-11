
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const BASE_URL = 'https://desertsmarttourism.com';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!MONGODB_URI) {
  console.error('MONGODB_URI .env.local mein nahi mila.');
  process.exit(1);
}

async function main() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const urls = new Set();

  function extractUrls(value) {
    if (!value) return;

    if (typeof value === 'string') {
      const matches = value.match(/\/api\/uploads\/[^"'\\\s]+/g);
      if (matches) matches.forEach(url => urls.add(url));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(extractUrls);
      return;
    }

    if (typeof value === 'object') {
      Object.values(value).forEach(extractUrls);
    }
  }

  for (const collection of collections) {
    const documents = await db.collection(collection.name).find({}).toArray();
    documents.forEach(extractUrls);
    console.log(`Scanned: ${collection.name} (${documents.length})`);
  }

  console.log(`\nTotal unique images found: ${urls.size}`);

  let downloaded = 0;
  let failed = [];

  for (const url of urls) {
    const filename = path.basename(url);
    const destination = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(destination)) {
      downloaded++;
      continue;
    }

    try {
      const response = await fetch(BASE_URL + url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(destination, buffer);
      downloaded++;

      console.log(`Downloaded: ${filename}`);
    } catch (error) {
      failed.push({ url, error: error.message });
      console.log(`FAILED: ${url} - ${error.message}`);
    }
  }

  console.log('\n========== RESULT ==========');
  console.log(`Downloaded / already present: ${downloaded}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length) {
    fs.writeFileSync(
      path.join(process.cwd(), 'failed-uploads.json'),
      JSON.stringify(failed, null, 2)
    );
    console.log('Failed URLs saved in failed-uploads.json');
  }

  await mongoose.disconnect();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
