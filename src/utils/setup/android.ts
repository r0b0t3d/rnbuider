import * as fs from 'fs';
import * as path from 'path';

function insertIntoProductFlavors(gradle: string, client: string): string {
  const blockStart = gradle.indexOf('productFlavors {');
  if (blockStart === -1) {
    const androidEnd = gradle.lastIndexOf('}');
    return (
      gradle.slice(0, androidEnd) +
      `\n    productFlavors {\n        ${client}\n    }\n` +
      gradle.slice(androidEnd)
    );
  }

  const bracePos = gradle.indexOf('{', blockStart) + 1;

  // Find closing brace of productFlavors block
  let depth = 1;
  let i = bracePos;
  while (i < gradle.length && depth > 0) {
    if (gradle[i] === '{') depth++;
    else if (gradle[i] === '}') depth--;
    i++;
  }
  const blockEnd = i - 1;

  const blockContent = gradle.slice(bracePos, blockEnd);
  const lines = blockContent.split('\n');

  // Detect indentation from existing flavor lines
  const existingLine = lines.find(l => /^\s+\w+\s*$/.test(l));
  const indent = existingLine ? (existingLine.match(/^(\s+)/) ?? ['', '        '])[1] : '        ';

  // Find insertion point to maintain alphabetical order
  let insertAt = lines.length - 1; // default: before last empty/closing line
  for (let li = 0; li < lines.length; li++) {
    const name = lines[li].trim();
    if (/^\w+$/.test(name) && name.localeCompare(client) > 0) {
      insertAt = li;
      break;
    }
  }

  lines.splice(insertAt, 0, `${indent}${client}`);
  return gradle.slice(0, bracePos) + lines.join('\n') + gradle.slice(blockEnd);
}

export function addProductFlavor({
  client,
}: {
  client: string;
}): void {
  const gradlePath = path.join(
    process.cwd(),
    'android/app/build.gradle',
  );

  if (!fs.existsSync(gradlePath)) {
    console.warn(`build.gradle not found at ${gradlePath} — skipping`);
    return;
  }

  const gradle = fs.readFileSync(gradlePath, 'utf-8');

  const flavorRegex = new RegExp(`^\\s+${client}\\s*$`, 'm');
  if (flavorRegex.test(gradle)) {
    console.log(`Flavor "${client}" already exists in build.gradle — skipping`);
    return;
  }

  const updated = insertIntoProductFlavors(gradle, client);
  fs.writeFileSync(gradlePath, updated, 'utf-8');
  console.log(`Added flavor "${client}" to android/app/build.gradle`);
}
