import { expect } from "chai";

export async function shouldThrow(p: Promise<any>, matches: RegExp) {
  try {
    await p;
  } catch(e) {
    expect(() => { throw e } ).throws(matches);
    return
  }

  expect.fail("Expected error matching: " + matches.source + " none thrown");
}