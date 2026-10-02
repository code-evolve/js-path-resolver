// Writes an .d.mts beside each .d.ts in types/.
//
// This package has no "type" field, so TypeScript reads a .d.ts here as describing a
// CommonJS module, where `export default` means `module.exports.default`. That is right for
// require() and wrong for import, which loads the .mjs build whose default export is the
// function itself: under node16 resolution an ES module consumer was told the default
// import was not callable. An .d.mts is read as an ES module, so the "import" condition
// points at these.
import { readdir, readFile, writeFile } from 'node:fs/promises'

const dir = new URL('../types/', import.meta.url)
for (const name of await readdir(dir)) {
  if (!name.endsWith('.d.ts')) continue
  const source = await readFile(new URL(name, dir), 'utf8')
  // Relative specifiers need an explicit extension in an ES module.
  const esm = source.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'")
  await writeFile(new URL(name.replace(/\.d\.ts$/, '.d.mts'), dir), esm)
}
