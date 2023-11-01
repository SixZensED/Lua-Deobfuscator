var assert = require("assert");
var substring = require("../index");

describe("unicode-substring", () => {
  var string = "Photo booth keytar Williamsburg twee selfies.";
  var unicodeString = "💥💣 emoji are awesome 💣💣💣 yeah";

  it("returns the full string if no start and end parameters are given", () => {
    assert.equal(substring(string), string);
  });

  it("skips characters before start position", () => {
    assert.equal(substring(string, 10), string.substring(10));
  });

  it("omits characters after end position", () => {
    assert.equal(substring(string, 0, 10), string.substring(0, 10));
  });

  it("swaps arguments if start > end", () => {
    assert.equal(substring(string, 10, 0), string.substring(0, 10));
  });

  it("doesn't break on negative indices", () => {
    assert.equal(substring(string, -1, 10), string.substring(0, 10));
    assert.equal(substring(string, 0, -1), string.substring(0, 0));
  });

  it("returns empty string if start and end are the same", () => {
    assert.equal(substring(string, 11, 11), "");
  });

  it("returns the rest of string when end is omitted", () => {
    assert.equal(substring(string, 1), string.substring(1));
  });

  it("consider surrogate pairs as one character", () => {
    assert.equal(
      substring(unicodeString, 0, unicodeString.length - 5),
      unicodeString
    );
    assert.equal(substring(unicodeString, 3, 8), "emoji");
    assert.equal(substring(unicodeString, 9, 22), "are awesome 💣");
  });

  it("counts broken surrogate pairs as a single character", () => {
    assert.equal(
      substring(unicodeString[0] + "💣", 0, 2),
      unicodeString[0] + "💣"
    );
  });
});
