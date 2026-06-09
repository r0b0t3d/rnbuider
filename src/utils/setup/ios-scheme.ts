import * as fs from 'fs';
import * as path from 'path';

function findSchemeDir(): string | null {
  const iosDir = path.join(process.cwd(), 'ios');
  if (!fs.existsSync(iosDir)) return null;

  for (const entry of fs.readdirSync(iosDir)) {
    if (!entry.endsWith('.xcodeproj')) continue;
    const candidate = path.join(iosDir, entry, 'xcshareddata', 'xcschemes');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function findExistingProdScheme(schemeDir: string): string | null {
  const files = fs
    .readdirSync(schemeDir)
    .filter(f => f.endsWith(' prod.xcscheme'));
  return files.length > 0 ? path.join(schemeDir, files[0]) : null;
}

function extractClientFromFilename(filename: string): string {
  return path.basename(filename, '.xcscheme').replace(/ prod$/, '');
}

export function createXcodeScheme({
  client,
}: {
  client: string;
  bundleId: string;
}): void {
  const schemeDir = findSchemeDir();
  if (!schemeDir) {
    console.warn(
      'Could not find xcshareddata/xcschemes — add iOS scheme manually',
    );
    return;
  }

  const targetScheme = path.join(schemeDir, `${client} prod.xcscheme`);
  if (fs.existsSync(targetScheme)) {
    console.log(`Scheme "${client} prod" already exists — skipping`);
    return;
  }

  const sourceScheme = findExistingProdScheme(schemeDir);
  if (!sourceScheme) {
    console.warn(
      'No existing "*prod.xcscheme" found to copy from — add iOS scheme manually',
    );
    return;
  }

  const oldClient = extractClientFromFilename(sourceScheme);
  let xml = fs.readFileSync(sourceScheme, 'utf-8');

  // Replace all occurrences of old client name — covers BuildableName,
  // BlueprintName, and pre-action script paths like configs/oldclient/.env.*
  xml = xml.split(oldClient).join(client);

  fs.writeFileSync(targetScheme, xml, 'utf-8');
  console.log(
    `Created iOS scheme "${client} prod" from "${path.basename(sourceScheme)}"`,
  );
}
