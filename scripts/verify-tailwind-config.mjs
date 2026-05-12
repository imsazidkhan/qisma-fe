// Quick sanity check that tailwind.config.ts loads via jiti (the same path
// tailwindcss 3.4 + NativeWind take). Not part of normal flow — invoke ad-hoc
// after touching the config: `node scripts/verify-tailwind-config.mjs`.
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { default: config } = await jiti.import('../tailwind.config.ts');

const colorsCount = Object.keys(config.theme.extend.colors).length;
const fontFamilyCount = Object.keys(config.theme.extend.fontFamily).length;
const radiusCount = Object.keys(config.theme.borderRadius).length;
const spacing11 = config.theme.spacing['11'];

console.log(JSON.stringify({ colorsCount, fontFamilyCount, radiusCount, spacing11 }, null, 2));
