import { Generator, getConfig } from '@tanstack/router-generator';
const config = await getConfig({ root: process.cwd() });
const g = new Generator({ config, root: process.cwd() });
await g.run();
console.log('done');
