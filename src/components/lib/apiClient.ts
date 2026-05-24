const LOG_PREFIX = "[FrontendLog]";

type EventContext = Record<string, unknown>;
type LogLevel = "info" | "warn" | "error";

interface LogEvent {
    level: LogLevel;
    type: string;
    message: string;
    context?: EventContext;
}

function sendToServer(event: LogEvent) {
    if (typeof window === "undefined") {
        return;
    }

    const payload = JSON.stringify({ ...event, timestamp: Date.now() });

    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/log", blob);
        return;
    }

    void fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
    });
}

function emit(level: LogLevel, type: string, message: string, context?: EventContext) {
    const event: LogEvent = { level, type, message, context };
    const logMethod = console[level] ?? console.info;

    if (context && Object.keys(context).length > 0) {
        logMethod(`${LOG_PREFIX} [${level}] [${type}] ${message}`, context);
    } else {
        logMethod(`${LOG_PREFIX} [${level}] [${type}] ${message}`);
    }

    sendToServer(event);
}

export function logPageView(path: string) {
    emit("info", "page", `Entered page: ${path}`);
}

export function logNavigation(from: string | null, to: string) {
    emit("info", "navigation", `Navigated to ${to}` + (from ? ` from ${from}` : ""));
}

export function logInteraction(
    action: string,
    targetDescription: string,
    context: EventContext = {},
) {
    const verb =
        action === "click" ? "clicked" : action === "submit" ? "submitted" : action;
    emit("info", "interaction", `${verb} on ${targetDescription}`, context);
}

export function logBackendRequest(
    method: string,
    url: string,
    status: number | string,
    context: EventContext = {},
) {
    emit(resolveBackendLevel(status), "backend", `${method} ${url} -> ${status}`, context);
}

function resolveBackendLevel(status: number | string): LogLevel {
    if (typeof status === "number") {
        if (status >= 500) return "error";
        if (status >= 400) return "warn";
        return "info";
    }

    const normalized = status.toLowerCase();
    if (normalized.includes("error")) return "error";

    return "warn";
}

export function describeElement(target: EventTarget | null): string {
    if (!(target instanceof Element)) {
        return "unknown target";
    }

    const tag = target.tagName.toLowerCase();

    const label =
        (target.getAttribute("aria-label") ||
            target.getAttribute("alt") ||
            (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
                ? target.placeholder
                : undefined) ||
            target.textContent?.trim());

    if (!label) {
        return tag;
    }

    const trimmedLabel = label.replace(/\s+/g, " ").trim().slice(0, 60);
    return `${tag} - ${trimmedLabel}`;
}