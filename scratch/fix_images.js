const fs = require('fs');
const files = [
  'packages/landing/src/app/page.tsx',
  'packages/landing/src/components/sections/TemplatesSection.tsx'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  // Remove bg-surface-container-low from the image containers
  content = content.replace(/aspect-video bg-surface-container-low/g, 'aspect-video');
  // Remove p-4 from the img tags
  content = content.replace(/class="object-contain p-4/g, 'class="object-contain');
  content = content.replace(/className="object-contain p-4/g, 'className="object-contain');
  fs.writeFileSync(file, content);
}
console.log('Done!');
