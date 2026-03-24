import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { LanguageProvider, useI18n } from "./language-provider";

function I18nConsumer() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="save">{t("common.save")}</span>
      <span data-testid="missing">{t("nonexistent.key")}</span>
      <span data-testid="interpolate">{t("auth.register.success.message", { email: "a@b.com" })}</span>
      <button onClick={() => setLocale("en")}>English</button>
      <button onClick={() => setLocale("zh")}>中文</button>
    </div>
  );
}

describe("LanguageProvider + useI18n", () => {
  afterEach(() => cleanup());

  it("默认语言为中文 → t('common.save') 返回 '保存'", () => {
    render(<LanguageProvider><I18nConsumer /></LanguageProvider>);
    expect(screen.getByTestId("locale").textContent).toBe("zh");
    expect(screen.getByTestId("save").textContent).toBe("保存");
  });

  it("切换语言为英文 → t('common.save') 返回 'Save'", () => {
    render(<LanguageProvider><I18nConsumer /></LanguageProvider>);
    act(() => screen.getByText("English").click());
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("save").textContent).toBe("Save");
  });

  it("key 不存在 → 返回 key 本身作为 fallback", () => {
    render(<LanguageProvider><I18nConsumer /></LanguageProvider>);
    expect(screen.getByTestId("missing").textContent).toBe("nonexistent.key");
  });

  it("变量插值 → {email} 被正确替换", () => {
    render(<LanguageProvider><I18nConsumer /></LanguageProvider>);
    const text = screen.getByTestId("interpolate").textContent;
    expect(text).toContain("a@b.com");
    expect(text).not.toContain("{email}");
  });
});
