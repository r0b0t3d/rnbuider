import * as fs from 'fs';
import * as path from 'path';

function insertIntoProductFlavors(gradle: string, flavor: string): string {
  // Find productFlavors block and insert before its closing brace
  const blockStart = gradle.indexOf('productFlavors {');
  if (blockStart === -1) {
    // No productFlavors block — append one inside android {}
    const androidEnd = gradle.lastIndexOf('}');
    return (
      gradle.slice(0, androidEnd) +
      `\n    productFlavors {\n${flavor}\n    }\n` +
      gradle.slice(androidEnd)
    );
  }

  // Walk forward matching braces to find closing }
  let depth = 0;
  let i = blockStart;
  while (i < gradle.length) {
    if (gradle[i] === '{') depth++;
    else if (gradle[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  return gradle.slice(0, i) + '\n' + flavor + '\n' + gradle.slice(i);
}

export function addProductFlavor({
  client,
  applicationId,
}: {
  client: string;
  applicationId: string;
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

  // Already has this flavor
  const flavorRegex = new RegExp(`\\b${client}\\s*\\{`);
  if (flavorRegex.test(gradle)) {
    console.log(`Flavor "${client}" already exists in build.gradle — skipping`);
    return;
  }

  const flavorBlock =
    `        ${client} {\n` +
    `            dimension "default"\n` +
    `            applicationId "${applicationId}"\n` +
    `        }`;

  const updated = insertIntoProductFlavors(gradle, flavorBlock);
  fs.writeFileSync(gradlePath, updated, 'utf-8');
  console.log(`Added flavor "${client}" to android/app/build.gradle`);
}
