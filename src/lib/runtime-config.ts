// Built-in marketplace accounts are available by default so the product works
// in any environment. Set NEXT_PUBLIC_ENABLE_DEMO_MODE=false to disable them.
export const isDemoMode =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "false";
