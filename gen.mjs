import { generator, getConfig } from '@tanstack/router-generator';
const config = await getConfig({ root: process.cwd() });
await generator(config).run();
console.log('done');
