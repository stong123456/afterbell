import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getInitialLocale,
  persistLocale,
} from "../src/i18n/locale.js";

function storageWith(value) {
  const values = new Map(value === undefined ? [] : [[LOCALE_STORAGE_KEY, value]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, nextValue) => values.set(key, nextValue),
    values,
  };
}

test("defaults first-time visitors to Chinese", () => {
  assert.equal(DEFAULT_LOCALE, "zh");
  assert.equal(getInitialLocale(storageWith()), "zh");
});

test("preserves an explicit supported language choice", () => {
  assert.equal(getInitialLocale(storageWith("en")), "en");
  assert.equal(getInitialLocale(storageWith("zh")), "zh");
  assert.equal(getInitialLocale(storageWith("invalid")), "zh");
});

test("persists the user's language selection", () => {
  const storage = storageWith();
  persistLocale("en", storage);
  assert.equal(storage.values.get(LOCALE_STORAGE_KEY), "en");
});
