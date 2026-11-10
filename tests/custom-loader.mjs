export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_UNSUPPORTED_DIR_IMPORT") &&
      (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("file://"))
    ) {
      for (const ext of [".ts", ".tsx", ".js", "/index.ts", "/index.js"]) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {
          // try next extension
        }
      }
    }
    throw err;
  }
}
