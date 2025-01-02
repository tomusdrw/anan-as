import fs from 'node:fs';

const META_FILE = './web/pvm-metadata.json';
const metadata = JSON.parse(fs.readFileSync(META_FILE));
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const hash = process.argv[2] || 'xxxxxx';

metadata.version = `${packageJson.version}-${hash.substring(0, 6)}`;

fs.writeFileSync(META_FILE, JSON.stringify(metadata, null, 2));
