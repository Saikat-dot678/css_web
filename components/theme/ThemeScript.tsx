const themeInitializer = `
(function () {
  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  var saved = null;
  try {
    saved = localStorage.getItem("css-theme");
  } catch (error) {}
  var theme = saved === "light" || saved === "dark" ? saved : systemTheme;
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[data-site-theme-color]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#080b0f" : "#f2efe6");
})();
`;

export function ThemeScript() {
  return (
    <script
      type="text/javascript"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitializer }}
    />
  );
}
