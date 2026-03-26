"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { docsService, type EndpointSummary, type EndpointDetail, type CategoryInfo } from "@/services/docsService";
import { signService } from "@/services/signService";
import {
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  PATCH: "bg-purple-100 text-purple-700",
};

export default function DocsPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAi, setCopiedAi] = useState(false);

  const fetchEndpoints = useCallback(() => {
    setLoading(true);
    setError(null);
    docsService.listEndpoints()
      .then((res) => {
        setCategories(res.categories);
        setEndpoints(res.endpoints);
      })
      .catch((err) => setError(err.message || t("docs.error")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const filteredEndpoints = useMemo(() => {
    let result = endpoints;
    if (selectedCategory) {
      result = result.filter((e) => e.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.summary.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.operationId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [endpoints, selectedCategory, search]);

  const handleSelectEndpoint = async (operationId: string) => {
    if (selectedEndpoint?.operationId === operationId) {
      setSelectedEndpoint(null);
      return;
    }
    setDetailLoading(true);
    try {
      const detail = await docsService.getEndpointDetail(operationId);
      setSelectedEndpoint(detail);
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyAiContext = async () => {
    if (!selectedEndpoint?.aiContextBlock) return;
    try {
      await navigator.clipboard.writeText(selectedEndpoint.aiContextBlock);
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
    } catch { /* */ }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div><div className="h-7 bg-[var(--gray-200)] rounded w-32 mb-2 animate-pulse" /><div className="h-4 bg-[var(--gray-100)] rounded w-72 animate-pulse" /></div>
        <div className="h-96 bg-[var(--gray-100)] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ExclamationTriangleIcon className="w-10 h-10 text-[var(--gray-400)] mb-3" />
        <p className="text-[var(--gray-500)] mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("docs.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("docs.subtitle")}</p>
      </div>

      <div className="flex gap-6">
        {/* Left: Categories + Search + List */}
        <div className="w-full lg:w-1/2 xl:w-2/5 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("docs.search.placeholder")}
              className="w-full pl-9 pr-3 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-[var(--primary-black)] text-white" : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
              }`}
            >
              {t("docs.allCategories")} ({endpoints.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key === selectedCategory ? "" : cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.key ? "bg-[var(--primary-black)] text-white" : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Endpoint list */}
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm divide-y divide-[var(--gray-100)] max-h-[calc(100vh-320px)] overflow-y-auto">
            {filteredEndpoints.length === 0 ? (
              <div className="p-8 text-center text-[var(--gray-400)] text-sm">{t("docs.noResults")}</div>
            ) : (
              filteredEndpoints.map((ep) => (
                <button
                  key={ep.operationId}
                  onClick={() => handleSelectEndpoint(ep.operationId)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--gray-50)] transition-colors ${
                    selectedEndpoint?.operationId === ep.operationId ? "bg-[var(--gray-50)]" : ""
                  }`}
                >
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[ep.method] || ""}`}>
                    {ep.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono text-[var(--gray-700)] truncate">{ep.path}</div>
                    <div className="text-xs text-[var(--gray-500)]">{ep.summary}</div>
                  </div>
                  <ChevronRightIcon className={`w-4 h-4 text-[var(--gray-400)] shrink-0 transition-transform ${
                    selectedEndpoint?.operationId === ep.operationId ? "rotate-90" : ""
                  }`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="hidden lg:block lg:w-1/2 xl:w-3/5">
          {detailLoading ? (
            <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
              <div className="w-6 h-6 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
            </div>
          ) : selectedEndpoint ? (
            <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm max-h-[calc(100vh-240px)] overflow-y-auto">
              {/* Detail header */}
              <div className="p-6 border-b border-[var(--gray-100)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[selectedEndpoint.method] || ""}`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="text-sm font-mono text-[var(--gray-900)]">{selectedEndpoint.path}</span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--gray-900)]">{selectedEndpoint.summary}</h2>
                <p className="text-sm text-[var(--gray-500)] mt-1">{selectedEndpoint.description}</p>
              </div>

              {/* Parameters */}
              {selectedEndpoint.parameters.length > 0 && (
                <div className="p-6 border-b border-[var(--gray-100)]">
                  <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">{t("docs.detail.parameters")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--gray-100)]">
                          <th className="text-left py-2 px-3 font-semibold text-[var(--gray-700)]">{t("docs.detail.param.name")}</th>
                          <th className="text-left py-2 px-3 font-semibold text-[var(--gray-700)]">{t("docs.detail.param.in")}</th>
                          <th className="text-left py-2 px-3 font-semibold text-[var(--gray-700)]">{t("docs.detail.param.required")}</th>
                          <th className="text-left py-2 px-3 font-semibold text-[var(--gray-700)]">{t("docs.detail.param.description")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.parameters.map((p, i) => (
                          <tr key={i} className="border-b border-[var(--gray-50)]">
                            <td className="py-2 px-3 font-mono text-[var(--gray-900)]">{String(p.name || "")}</td>
                            <td className="py-2 px-3 text-[var(--gray-500)]">{String(p.in || "")}</td>
                            <td className="py-2 px-3">{p.required ? <span className="text-red-600">*</span> : ""}</td>
                            <td className="py-2 px-3 text-[var(--gray-600)]">{String(p.description || "")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedEndpoint.requestBody && (
                <div className="p-6 border-b border-[var(--gray-100)]">
                  <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">{t("docs.detail.requestBody")}</h3>
                  <pre className="text-xs font-mono bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto text-[var(--gray-700)]">
                    {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Responses */}
              <div className="p-6 border-b border-[var(--gray-100)]">
                <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">{t("docs.detail.responses")}</h3>
                <pre className="text-xs font-mono bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto text-[var(--gray-700)]">
                  {JSON.stringify(selectedEndpoint.responses, null, 2)}
                </pre>
              </div>

              {/* Code Samples */}
              <div className="p-6 border-b border-[var(--gray-100)]">
                <CodeSamples endpoint={selectedEndpoint} />
              </div>

              {/* Try It */}
              <div className="p-6 border-b border-[var(--gray-100)]">
                <TryItPanel endpoint={selectedEndpoint} />
              </div>

              {/* AI Context Block */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--gray-900)]">{t("docs.detail.aiContext")}</h3>
                  <button onClick={handleCopyAiContext}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--gray-300)] rounded-lg text-xs text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors">
                    {copiedAi ? (
                      <><CheckIcon className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">{t("docs.detail.aiContext.copied")}</span></>
                    ) : (
                      <><ClipboardDocumentIcon className="w-3.5 h-3.5" /><span>{t("docs.detail.aiContext.copy")}</span></>
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono bg-[var(--gray-900)] text-green-400 rounded-lg p-4 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {selectedEndpoint.aiContextBlock}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm flex items-center justify-center h-96 text-[var(--gray-400)] text-sm">
              {t("docs.detail.clickToView")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Code Samples Component ─── */

const LANGUAGES = [
  { key: "cURL", label: "cURL", color: "text-yellow-400" },
  { key: "TypeScript", label: "TypeScript", color: "text-blue-400" },
  { key: "Python", label: "Python", color: "text-green-400" },
  { key: "Java", label: "Java", color: "text-orange-400" },
  { key: "Go", label: "Go", color: "text-cyan-400" },
  { key: "Rust", label: "Rust", color: "text-red-400" },
] as const;
type Lang = typeof LANGUAGES[number]["key"];

function CodeSamples({ endpoint }: { endpoint: EndpointDetail }) {
  const [lang, setLang] = useState<Lang>("cURL");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => generateCode(endpoint, lang), [endpoint, lang]);
  const activeLang = LANGUAGES.find((l) => l.key === lang)!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Code Samples</h3>
      <div className="rounded-xl overflow-hidden border border-[var(--gray-700)] bg-[var(--gray-900)]">
        {/* Language tabs bar */}
        <div className="flex items-center justify-between bg-[var(--gray-900)] px-1 py-1 border-b border-[var(--gray-700)]">
          <div className="flex">
            {LANGUAGES.map((l) => (
              <button key={l.key} onClick={() => setLang(l.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  lang === l.key
                    ? "bg-[var(--gray-900)] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors mr-1"
            aria-label="Copy code">
            {copied ? (
              <><CheckIcon className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
            ) : (
              <><ClipboardDocumentIcon className="w-3.5 h-3.5" /><span>Copy</span></>
            )}
          </button>
        </div>
        {/* Code block */}
        <div className="relative">
          <span className={`absolute top-3 right-3 text-[10px] font-medium ${activeLang.color} opacity-50`}>
            {activeLang.label}
          </span>
          <pre className="text-[13px] leading-5 font-mono text-gray-300 p-4 overflow-x-auto max-h-[420px] overflow-y-auto whitespace-pre">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ─── Try It Panel ─── */

const SANDBOX_BASE = "https://openapitest.osl-pay.com";

function TryItPanel({ endpoint }: { endpoint: EndpointDetail }) {
  const { t } = useI18n();
  const { isSandbox } = useEnvironment();
  const [appId, setAppId] = useState("YOUR_APP_ID");
  const [privateKey, setPrivateKey] = useState("");
  const [bodyText, setBodyText] = useState(() => {
    const ex = getExampleBody(endpoint);
    return ex || "";
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ statusCode: number; body: string; durationMs: number } | null>(null);
  const [error, setError] = useState("");
  const [signed, setSigned] = useState(false);

  // Reset when endpoint changes
  useEffect(() => {
    const ex = getExampleBody(endpoint);
    setBodyText(ex || "");
    setResponse(null);
    setError("");
  }, [endpoint.operationId]);

  const handleSend = async () => {
    setLoading(true);
    setError("");
    setResponse(null);
    setSigned(false);

    const timestamp = String(Date.now());
    const url = `${SANDBOX_BASE}${endpoint.path}`;
    const hasBody = endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH";

    try {
      let signature = "PLACEHOLDER_SIGN";
      if (privateKey.trim()) {
        const signResult = await signService.generate({ appId, timestamp, privateKey: privateKey.trim() });
        signature = signResult.signature;
        setSigned(true);
      }
      const res = await docsService.proxy({
        method: endpoint.method,
        url,
        headers: {
          "Content-Type": "application/json",
          "appId": appId,
          "timestamp": timestamp,
          "signature": signature,
        },
        body: hasBody ? bodyText : undefined,
      });
      setResponse(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!isSandbox) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">{t("docs.tryIt.title")}</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          {t("docs.tryIt.sandboxOnly")}
        </div>
      </div>
    );
  }

  const hasBody = endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH";
  const formattedBody = response?.body ? tryFormatJson(response.body) : "";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PlayIcon className="w-4 h-4 text-[var(--gray-500)]" />
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">{t("docs.tryIt.title")}</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Sandbox</span>
      </div>

      <div className="space-y-3">
        {/* URL preview */}
        <div className="flex items-center gap-2 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg px-3 py-2">
          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[endpoint.method] || ""}`}>
            {endpoint.method}
          </span>
          <span className="text-xs font-mono text-[var(--gray-600)] truncate">{SANDBOX_BASE}{endpoint.path}</span>
        </div>

        {/* App ID */}
        <div>
          <label className="block text-xs font-medium text-[var(--gray-600)] mb-1">{t("docs.tryIt.appId")}</label>
          <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)}
            className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Private Key (optional, for auto-signing) */}
        <div>
          <label className="block text-xs font-medium text-[var(--gray-600)] mb-1">{t("docs.tryIt.privateKey")}</label>
          <textarea value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} rows={3}
            placeholder={t("docs.tryIt.privateKey.placeholder")}
            className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2 text-xs font-mono resize-y placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Body */}
        {hasBody && (
          <div>
            <label className="block text-xs font-medium text-[var(--gray-600)] mb-1">{t("docs.tryIt.body")}</label>
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={6}
              className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        )}

        {/* Send button */}
        <div className="flex items-center gap-3">
          <button onClick={handleSend} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            <PlayIcon className="w-4 h-4" />
            {loading ? t("docs.tryIt.sending") : t("docs.tryIt.send")}
          </button>
          {signed && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckIcon className="w-3.5 h-3.5" />
              {t("docs.tryIt.autoSigned")}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
        )}

        {/* Response */}
        {response && (
          <div className="rounded-xl overflow-hidden border border-[var(--gray-700)] bg-[var(--gray-900)]">
            <div className="flex items-center gap-4 px-4 py-2 bg-[var(--gray-900)] border-b border-[var(--gray-700)]">
              <span className="text-xs text-gray-400">{t("docs.tryIt.response")}</span>
              <span className={`text-xs font-mono font-semibold ${response.statusCode < 400 ? "text-green-400" : "text-red-400"}`}>
                {response.statusCode}
              </span>
              <span className="text-xs text-gray-500">{response.durationMs}ms</span>
            </div>
            <pre className="text-[13px] leading-5 font-mono text-gray-300 p-4 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre">
              {formattedBody}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function tryFormatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function getExampleBody(endpoint: EndpointDetail): string | null {
  if (!endpoint.requestBody) return null;
  try {
    const content = (endpoint.requestBody as Record<string, unknown>).content as Record<string, unknown> | undefined;
    if (!content) return null;
    const json = content["application/json"] as Record<string, unknown> | undefined;
    if (!json) return null;
    const example = json.example;
    if (example) return JSON.stringify(example, null, 2);
    return '{\n  "key": "value"\n}';
  } catch {
    return '{\n  "key": "value"\n}';
  }
}

function generateCode(ep: EndpointDetail, lang: Lang): string {
  const baseUrl = "https://openapitest.osl-pay.com";
  const url = `${baseUrl}${ep.path}`;
  const body = getExampleBody(ep);
  const hasBody = ep.method === "POST" || ep.method === "PUT" || ep.method === "PATCH";

  switch (lang) {
    case "cURL":
      return generateCurl(ep, url, body, hasBody);
    case "TypeScript":
      return generateTypeScript(ep, url, body, hasBody);
    case "Python":
      return generatePython(ep, url, body, hasBody);
    case "Java":
      return generateJava(ep, url, body, hasBody);
    case "Go":
      return generateGo(ep, url, body, hasBody);
    case "Rust":
      return generateRust(ep, url, body, hasBody);
  }
}

function generateCurl(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  const lines = [
    `curl -X ${ep.method} '${url}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'appId: YOUR_APP_ID' \\`,
    `  -H 'timestamp: UNIX_TIMESTAMP_MS' \\`,
    `  -H 'signature: YOUR_SIGNATURE'`,
  ];
  if (hasBody && body) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -d '${body.replace(/\n/g, "\n  ")}'`);
  }
  return lines.join("\n");
}

function generateTypeScript(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  return `// ${ep.summary}
// npm install node-fetch (or use built-in fetch)
import crypto from "crypto";

const APP_ID = "YOUR_APP_ID";
const PRIVATE_KEY = \`-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----\`;

const timestamp = Date.now().toString();
const signStr = \`appId=\${APP_ID}&timestamp=\${timestamp}\`;
const sign = crypto.sign("sha256", Buffer.from(signStr), {
  key: PRIVATE_KEY,
  padding: crypto.constants.RSA_PKCS1_PADDING,
}).toString("base64");

const response = await fetch("${url}", {
  method: "${ep.method}",
  headers: {
    "Content-Type": "application/json",
    "appId": APP_ID,
    "timestamp": timestamp,
    "signature": sign,
  },${hasBody && body ? `\n  body: JSON.stringify(${body}),` : ""}
});

const data = await response.json();
console.log(data);`;
}

function generatePython(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  return `# ${ep.summary}
# pip install requests cryptography
import time, base64, json, requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

APP_ID = "YOUR_APP_ID"
PRIVATE_KEY_PEM = """-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"""

timestamp = str(int(time.time() * 1000))
sign_str = f"appId={APP_ID}&timestamp={timestamp}"

private_key = serialization.load_pem_private_key(PRIVATE_KEY_PEM.encode(), password=None)
signature = private_key.sign(sign_str.encode(), padding.PKCS1v15(), hashes.SHA256())
sign = base64.b64encode(signature).decode()

headers = {
    "Content-Type": "application/json",
    "appId": APP_ID,
    "timestamp": timestamp,
    "signature": sign,
}
${hasBody && body
    ? `\ndata = ${body}\n\nresponse = requests.${ep.method.toLowerCase()}("${url}", headers=headers, json=data)`
    : `\nresponse = requests.${ep.method.toLowerCase()}("${url}", headers=headers)`}
print(response.json())`;
}

function generateJava(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  return `// ${ep.summary}
import java.net.URI;
import java.net.http.*;
import java.security.*;
import java.util.Base64;

public class ApiExample {
    public static void main(String[] args) throws Exception {
        String appId = "YOUR_APP_ID";
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signStr = "appId=" + appId + "&timestamp=" + timestamp;

        // Load private key and sign
        // PrivateKey privateKey = loadPrivateKey("private_pkcs8.pem");
        Signature sig = Signature.getInstance("SHA256withRSA");
        // sig.initSign(privateKey);
        // sig.update(signStr.getBytes());
        // String sign = Base64.getEncoder().encodeToString(sig.sign());

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .header("Content-Type", "application/json")
            .header("appId", appId)
            .header("timestamp", timestamp)
            .header("signature", "YOUR_SIGNATURE")
            .method("${ep.method}", ${hasBody && body
              ? `HttpRequest.BodyPublishers.ofString("""\n${body.split("\n").map(l => "                " + l).join("\n")}\n                """)`
              : "HttpRequest.BodyPublishers.noBody()"})
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`;
}

function generateGo(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  return `// ${ep.summary}
package main

import (
\t"crypto"
\t"crypto/rand"
\t"crypto/rsa"
\t"crypto/sha256"
\t"encoding/base64"
\t"fmt"
\t"io"
\t"net/http"
\t"strings"
\t"time"
)

func main() {
\tappID := "YOUR_APP_ID"
\ttimestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
\tsignStr := fmt.Sprintf("appId=%s&timestamp=%s", appID, timestamp)

\t// Sign with RSA SHA256
\thashed := sha256.Sum256([]byte(signStr))
\t// signature, _ := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
\t// sign := base64.StdEncoding.EncodeToString(signature)

${hasBody && body
    ? `\tbody := strings.NewReader(\`${body}\`)
\treq, _ := http.NewRequest("${ep.method}", "${url}", body)`
    : `\treq, _ := http.NewRequest("${ep.method}", "${url}", nil)`}
\treq.Header.Set("Content-Type", "application/json")
\treq.Header.Set("appId", appID)
\treq.Header.Set("timestamp", timestamp)
\treq.Header.Set("signature", "YOUR_SIGNATURE")

\tresp, _ := http.DefaultClient.Do(req)
\tdefer resp.Body.Close()
\tdata, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(data))
}`;
}

function generateRust(ep: EndpointDetail, url: string, body: string | null, hasBody: boolean): string {
  return `// ${ep.summary}
// Cargo.toml: reqwest = { version = "0.12", features = ["json"] }
//             tokio = { version = "1", features = ["full"] }

use reqwest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app_id = "YOUR_APP_ID";
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_millis()
        .to_string();
    let sign_str = format!("appId={}&timestamp={}", app_id, timestamp);
    // let sign = rsa_sha256_sign(&sign_str, &private_key);

    let client = reqwest::Client::new();
    let response = client
        .${ep.method.toLowerCase()}("${url}")
        .header("Content-Type", "application/json")
        .header("appId", app_id)
        .header("timestamp", &timestamp)
        .header("signature", "YOUR_SIGNATURE")${hasBody && body ? `\n        .body(r#"${body}"#.to_string())` : ""}
        .send()
        .await?;

    println!("{}", response.text().await?);
    Ok(())
}`;
}
