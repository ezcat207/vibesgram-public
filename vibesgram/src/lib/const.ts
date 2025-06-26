export const DISCORD_INVITE_URL = "https://discord.gg/t4P8S6DH2p";

/**
 * Tool name enum that directly maps to API call names
 * Used by both frontend and backend to maintain consistency
 */
export enum ToolName {
  CODE_EDITOR = "codeeditor",
  PUBLISH = "publish",
}

// This should be set on both server and client side.
// Otherwise the chat would stop mysteriously after a tool call.
// https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-tool-usage#client-side-page
export const MAX_STEPS = 10;

/**
 * Maximum size limit for artifact files in bytes
 * 10MB = 10 * 1024 * 1024
 */
export const MAX_ARTIFACT_FILE_TOTAL_SIZE = 10 * 1024 * 1024;

/**
 * Maximum size limit for cover image
 * Unit: KB (kilobytes)
 */
export const MAX_COVER_IMAGE_SIZE_KB = 1000;

/**
 * Maximum number of artifacts a user can create
 */
export const MAX_USER_ARTIFACTS = 20;

// disable agent until we are ready to launch
export const DISABLE_AGENT = true;



export const SCREENSHOT_TIMEOUT_MS = 10000;

/**
 * 预览有效期（小时）
 * 7天 = 7 * 24 小时
 */
export const PREVIEW_EXPIRATION_HOURS = 7 * 24;

/**
 * 预览有效期（毫秒）
 * 用于所有需要毫秒参数的场景，统一引用
 */
export const PREVIEW_EXPIRES_MS = PREVIEW_EXPIRATION_HOURS * 60 * 60 * 1000;
