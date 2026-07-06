// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: false,
  modules: ["@vizejs/nuxt", "@nuxtjs/tailwindcss"],
  vize: {
    compiler: true,
  },
  app: {
    head: {
      title: "マインインポーザー (Mine Imposer)",
      meta: [
        { name: "description", content: "「論理」×「速度」×「心理戦」の対戦型マインスイーパー" }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" }
      ]
    }
  },
  css: ["~/assets/css/main.css"]
});
