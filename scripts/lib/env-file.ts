export function parseEnv(contents: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const line of contents.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;

        const separator = trimmed.indexOf("=");
        if (separator === -1) continue;

        const key = trimmed.slice(0, separator).trim();
        const rawValue = trimmed.slice(separator + 1).trim();
        result[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    }

    return result;
}

export function upsertEnvLine(
    contents: string,
    key: string,
    value: string,
): string {
    const line = `${key}=${value}`;
    const lines = contents.length === 0 ? [] : contents.split("\n");
    const trailingNewline = contents.endsWith("\n");
    if (trailingNewline) lines.pop();

    const index = lines.findIndex((l) => {
        const trimmed = l.trim();
        if (trimmed === "" || trimmed.startsWith("#")) return false;
        const separator = trimmed.indexOf("=");
        if (separator === -1) return false;
        return trimmed.slice(0, separator).trim() === key;
    });

    if (index === -1) {
        lines.push(line);
    } else {
        lines[index] = line;
    }

    return lines.join("\n") + "\n";
}

export type ConvexUrlSource = "override" | "convex-url";

export function resolveConvexUrl(
    env: Record<string, string>,
): { url: string; source: ConvexUrlSource } | undefined {
    const override = env.CONVEX_URL_OVERRIDE?.trim();
    if (override) return {url: override, source: "override"};

    const url = env.CONVEX_URL?.trim();
    if (url) return {url, source: "convex-url"};

    return undefined;
}
