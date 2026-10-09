const path = require('node:path')
const tsJest = require('ts-jest').default

const tsTransformer = tsJest.createTransformer({
  tsconfig: path.join(__dirname, 'tsconfig.jest.json'),
})

const viteEnvExpression = '(globalThis.__VITE_ENV__ ?? (globalThis.__VITE_ENV__ = {}))'

function replaceImportMetaEnv(code) {
  return code
    .split('import.meta.env')
    .join(viteEnvExpression)
    .replace(/\n\/\/# sourceMappingURL=[^\n]*$/, '')
}

module.exports = {
  process(sourceText, sourcePath, transformOptions) {
    const result = tsTransformer.process(sourceText, sourcePath, transformOptions)
    if (typeof result === 'string') {
      return replaceImportMetaEnv(result)
    }
    if (result && typeof result.code === 'string') {
      return { ...result, code: replaceImportMetaEnv(result.code), map: undefined }
    }
    return result
  },
  getCacheKey(...args) {
    const base = tsTransformer.getCacheKey
      ? tsTransformer.getCacheKey(...args)
      : String(args[1])
    return `${base}:worksphere-import-meta-env`
  },
}
