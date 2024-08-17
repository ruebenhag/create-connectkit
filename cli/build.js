import cpy from 'cpy';
import * as esbuild from 'esbuild';
import path from 'path';

const targetPath = './templates';
const templatesPath = '../examples';
const ignoreList = [
  'node_modules', 
  '.next', 
  'dist', 
  'CHANGELOG.md', 
  'yarn.lock', 
  'next-env.d.ts', 
  '.env.local'
];

// Copy files from the templates path to the target path, excluding the ignore list
await cpy(path.join(templatesPath, '**', '*'), targetPath, {
  filter: (src) => {
    const relativePath = path.relative(templatesPath, src.path);
    // Exclude paths in the ignore list and the README.md file
    return ignoreList.every(ignore => !relativePath.includes(ignore)) && relativePath !== 'README.md';
  },
  rename: (name) => name.replace(/^_dot_/, '.'), // Rename files with "_dot_" prefix to start with "."
});

const isWatching = process.argv.includes('--watch');

// Build the project with esbuild
esbuild.build({
  bundle: true,
  entryPoints: ['./src/index.ts'],
  format: 'esm',
  outdir: 'dist',
  platform: 'node',
  plugins: [
    {
      name: 'make-all-packages-external',
      setup(build) {
        const filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Exclude absolute and relative paths
        build.onResolve({ filter }, (args) => ({
          external: true,
          path: args.path,
        }));
      },
    },
  ],
  watch: isWatching
    ? {
        onRebuild(error, result) {
          if (error) console.error('watch build failed:', error);
          else console.log('watch build succeeded:', result);
        },
      }
    : undefined,
})
.then(() => {
  if (isWatching) {
    console.log('watching...');
  }
})
.catch(() => process.exit(1));
