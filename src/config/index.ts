// File: src/config/index.ts
export const PUBLIC_URL: string =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/gateway-api";
export const PRIVATE_URL: string =
    process.env.NEXT_PRIVATE_BACKEND_URL || "http://gateway-service:8080/gateway-api";


export const API_ENDPOINTS = {
    // Authentication
    VERIFY_TOKEN: `${PRIVATE_URL}/auth/token/verify`,
    REFRESH_TOKEN: `${PUBLIC_URL}/auth/token/refresh`,
    ACTIVATE_USER_READ: `${PRIVATE_URL}/auth/activate/{tenantId}/{userId}`,
    ACTIVATE_USER_PUT: `${PRIVATE_URL}/auth/activate`,
    LOGIN: `${PUBLIC_URL}/auth/login`,
    LOGOUT: `${PUBLIC_URL}/auth/logout`,
    AZURE_AUTHORIZE: `${PUBLIC_URL}/auth/oauth2/authorization/azure`,
    NEW_CHAT: `${PRIVATE_URL}/ai/chats`,
    ACCEPT_TOS: `${PRIVATE_URL}/auth/accept-tos/{userId}`,
    // http://localhost:8080/gateway-api/auth/oauth2/authorization/azure
    // auth-service/oauth2/authorization/azure

    // User
    USERINFO: `${PUBLIC_URL}/users/userinfo`,
    USER_FEEDBACK: `${PRIVATE_URL}/users/feedback`,
    //Chat
    CHAT_ID: `${PRIVATE_URL}/chat/chats/{chatId}`,
    ALL_CHATS: `${PRIVATE_URL}/chat/chats/user/{user_identifier}`,
    MANAGER_CHATS: `${PRIVATE_URL}/chat/chats/user/{user_identifier}/companion`,
    MESSAGE: `${PRIVATE_URL}/ai/chat/{chatId}/complete`,
    STREAM_MESSAGE: `${PRIVATE_URL}/ai/chat/{chatId}/stream`,
    JOURNEY_MESSAGE: `${PRIVATE_URL}/ai/journey/{chatId}/complete`,
    JOURNEY_STREAM_MESSAGE: `${PRIVATE_URL}/ai/journey/{chatId}/stream`,
    CHAT_TITLE: `${PRIVATE_URL}/ai/chat/{chatId}/title`,
    DELETE_CHAT: `${PRIVATE_URL}/ai/chats/{chatId}`,
    MESSAGE_FEEDBACK_POST: `${PRIVATE_URL}/chat/feedback/{messageId}`,
    MESSAGE_FEEDBACK_DESCRIPTION: `${PRIVATE_URL}/chat/feedback/{messageId}/description`,
    PASSWORD_RESET_REQUEST: `${PUBLIC_URL}/auth/password/reset/request`,
    PASSWORD_RESET_CONFIRM: `${PUBLIC_URL}/auth/password/reset/confirm`,

    // Profile
    AI_INSTRUCTIONS_GET   : `${PUBLIC_URL}/profile/profiles/{profileId}/ai-instructions`,
    AI_INSTRUCTIONS_UPSERT: `${PUBLIC_URL}/profile/profiles/{profileId}/ai-instructions`,
    AI_INSTRUCTIONS_RESET : `${PUBLIC_URL}/profile/profiles/{profileId}/ai-instructions`,
    DELETE_PIC: `${PRIVATE_URL}/profile/profiles/{id}/picture`,
    UPLOAD_PIC: `${PRIVATE_URL}/profile/profiles/{id}/picture`,
    GET_PIC: `${PRIVATE_URL}/profile/profiles/{id}/picture`,

    SKILL_SEARCH_NAME : `${PUBLIC_URL}/skill/skills/search/name`,
    SKILL_SEARCH_DTO  : `${PUBLIC_URL}/skill/skills/search`,

    GRAPHQL: `${PUBLIC_URL}/graphql`,

    /* Admin */
    UPLOAD_ROADMAP: `${PRIVATE_URL}/roadmap/csv/upload-zip`,
    UPDATE_CONCEPT_MAP: `${PRIVATE_URL}/roadmap/concept-map/{id}`,
    CREATE_CONCEPT_MAP: `${PRIVATE_URL}/roadmap/concept-map`,
    CONCEPT_BULK_UPLOAD: `${PRIVATE_URL}/roadmap/csv/concepts`,
    CREATE_SKILL: `${PRIVATE_URL}/skill/skills`,
    USER_SEARCH: `${PRIVATE_URL}/users/search`,
    TEAM_SEARCH: `${PRIVATE_URL}/team/teams/search`,
    PROMPT_DEFS: `${PRIVATE_URL}/prompt/definitions`,
    PROMPT_ALL_VERSIONS: `${PRIVATE_URL}/prompt/versions`,
    PROMPT_VERSION: `${PRIVATE_URL}/prompt/versions/{versionId}`,
    VERSIONS_BY_DEFINITION: `${PRIVATE_URL}/prompt/versions/{promptId}/all-sorted`,
    PROMPT_ACTIVATE_VERSION: `${PRIVATE_URL}/prompt/versions/{versionId}/activate`,
    PROMPT_VERSION_REVISIONS: `${PRIVATE_URL}/prompt/versions/{versionId}/revisions`,
    PROMPT_VERSION_ROLLBACK: `${PRIVATE_URL}/prompt/versions/{versionId}/rollback/{revisionId}`,
    LLM_MODEL_SWITCH: `${PRIVATE_URL}/ai/internal/llm/model`,
    USER_EMAIL_INVITE: `${PRIVATE_URL}/users/emails/{type}`,
    USER_EMAIL_INVITE_BATCH: `${PRIVATE_URL}/users/emails/{type}/batch`,
    USER_EMAIL_CUSTOM_SEND: `${PRIVATE_URL}/users/emails/custom`,
    USER_EMAIL_CUSTOM_SEND_BATCH: `${PRIVATE_URL}/users/emails/custom/batch`,
    USER_EMAIL_TEMPLATE: `${PRIVATE_URL}/users/email-templates/{templateType}`,
    USER_EMAIL_TEMPLATE_UPDATE: `${PRIVATE_URL}/users/email-templates/{templateId}`,
    USER_EMAIL_TEMPLATE_IMAGE: `${PRIVATE_URL}/users/email-templates/{templateType}/image`,
};

export const API_ROUTES = {
    PROFILE_PICTURE: `/api/profile/[id]/picture`,
    CHAT_LIST: `/api/chat/list`,
    CHAT_MANAGER_LIST: `/api/chat/manager`,
    CHAT_CREATE: `/api/chat/create`,
    CHAT_DELETE: `/api/chat/[chatId]/delete`,
    CHAT_MESSAGES: `/api/chat/[chatId]/messages`,
    CHAT_SEND: `/api/chat/[chatId]/send`,
    CHAT_STREAM: `/api/chat/[chatId]/stream`,
    CHAT_TITLE: `/api/chat/[chatId]/title`,
    CHAT_REMOVED: `/api/chat/[chatId]/removed`,
    CHAT_PINNED: `/api/chat/[chatId]/pinned`,
    CHAT_FEEDBACK_DESCRIPTION: `/api/chat/feedback/description`,
    CHAT_FEEDBACK_THUMB: `/api/chat/feedback/thumb`,

    ACTIVATE_USER_ROUTE: "/api/user/[userId]/activate",
    ACCEPT_TOS: "/api/user/[userId]/accept-tos",
    USER_FEEDBACK: "/api/feedback",
    /* Admin*/
    UPLOAD_ROADMAP: `/api/admin/roadmap/csv`,
    CREATE_CONCEPT_MAP: '/api/admin/roadmap/maps',
    UPDATE_CONCEPT_MAP: '/api/admin/roadmap/maps',
    CONCEPT_BULK_UPLOAD: '/api/admin/roadmap/maps/concepts/bulk',
    CREATE_SKILL: '/api/admin/skills',
    USER_SEARCH: '/api/admin/roadmap/search/users',
    TEAM_SEARCH: '/api/admin/roadmap/search/teams',
    PROMPT_DEFS: `/api/admin/prompt`,
    PROMPT_ALL_VERSIONS: `/api/admin/prompt/[promptId]`,
    PROMPT_VERSION_BY_ID: `/api/admin/prompt/[promptId]/[versionId]`,
    PROMPT_ACTIVATE_VERSION: `/api/admin/prompt/[promptId]/[versionId]/activate`,
    PROMPT_VERSION_REVISIONS: `/api/admin/prompt/[promptId]/[versionId]/revisions`,
    PROMPT_VERSION_ROLLBACK: `/api/admin/prompt/[promptId]/[versionId]/revisions/[revisionId]`,
    LLM_MODEL_SWITCH: `/api/admin/llm-model`,
};


export const PUBLIC_WS_URL_VTT = (process.env.NEXT_PUBLIC_WS_URL || "") + "/vtt"
export const PUBLIC_WS_URL_TTS = (process.env.NEXT_PUBLIC_TTS_URL || "") + "/tts"
export const PUBLIC_WS_URL_OB = (process.env.NEXT_PUBLIC_WS_URL_OB || "") + "/cache/ws/onboarding"
export const PUBLIC_SSE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "") + "/cache/sse"
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@noetic.is"

export const APP_NAME = 'YourAppName';
export const MAX_LOGIN_ATTEMPTS = 5;

export const DEFAULT_CHAT_TITLE = "New Chat";
// ... other constants