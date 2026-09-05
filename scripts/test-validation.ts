import assert from "node:assert/strict";
import { urlSchema } from "../lib/validation/common";
import { resourceInputSchema } from "../lib/validation/resource";

for (const value of ["https://example.com/path?q=1", "http://localhost:3000/test", "/uploads/image.png", "/api/posters/demo", "#", " /safe-looking "]) {
  assert.equal(urlSchema.safeParse(value).success, true, `expected safe URL: ${value}`);
}

for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "ftp://example.com/file", "//evil.example/path", "/path with space"]) {
  assert.equal(urlSchema.safeParse(value).success, false, `expected unsafe URL rejection: ${value}`);
}

const baseResource = {
  title: "Safe resource",
  description: "A resource used to exercise backend URL validation.",
  category: "technical_resources" as const,
  featured: false,
};
assert.equal(resourceInputSchema.safeParse({ ...baseResource, url: "https://example.com" }).success, true);
assert.equal(resourceInputSchema.safeParse({ ...baseResource, url: "javascript:alert(document.domain)" }).success, false);

console.info("URL scheme, protocol-relative path, trimming, and resource boundary validation passed.");
