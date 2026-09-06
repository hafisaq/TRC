import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/media.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { imgSized, imageSrcSet, registerMedia, videoForPoster, keyForPoster, hasFilm } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const image = "https://cdn.sanity.io/images/project/production/example-2400x1600.jpg";

test("resizes already transformed Sanity images without losing the crop", () => {
  const url = new URL(imgSized(`${image}?w=1600&rect=20,30,800,600&fit=crop`, 480));
  assert.equal(url.searchParams.get("w"), "480");
  assert.equal(url.searchParams.get("rect"), "20,30,800,600");
  assert.equal(url.searchParams.get("fit"), "crop");
  assert.equal(url.searchParams.get("auto"), "format");
});

test("image sizes are positive integers and never upscale by default", () => {
  assert.equal(new URL(imgSized(image, 639.6)).searchParams.get("w"), "640");
  assert.equal(new URL(imgSized(image, -5)).searchParams.get("w"), "1");
  assert.equal(new URL(imgSized(image)).searchParams.get("fit"), "max");
});

test("local and external images pass through untouched", () => {
  for (const url of ["/media/poster/reef-dive.jpg", "https://example.com/photo.jpg?x=1"]) {
    assert.equal(imgSized(url, 400), url);
    assert.equal(imageSrcSet(url), undefined);
  }
});

test("responsive sources stop at the requested and original resolution", () => {
  const small = image.replace("2400x1600", "600x400");
  const widths = imageSrcSet(small, 1100).split(", ").map(s => Number(s.match(/ (\d+)w$/)[1]));
  assert.deepEqual(widths, [320, 480, 600]);
  assert.equal(imageSrcSet(image, 800).split(", ").filter(s => s.endsWith(" 800w")).length, 1);
});

test("an image-only CMS entry never becomes a bogus video URL", () => {
  assert.equal(videoForPoster(image), undefined);
  assert.equal(hasFilm(keyForPoster(image)), false);
});

test("registered films and bundled demo films still resolve", () => {
  const film = "https://cdn.sanity.io/files/project/production/movie.mp4";
  registerMedia("test-film", { poster: image, film });
  assert.equal(videoForPoster(image), film);
  assert.equal(hasFilm("test-film"), true);
  assert.equal(videoForPoster("/media/poster/reef-dive.jpg"), "/media/video/reef-dive.mp4");
});
