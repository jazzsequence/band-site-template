import { describe, expect, it } from "vitest";

import { documentUri, publicationUri } from "../lib/site/standard-site";

describe("standard.site config", () => {
  it("serves nothing until records exist, rather than a malformed value", () => {
    expect(publicationUri()).toBeNull();
    expect(documentUri("/press")).toBeNull();
    expect(documentUri("/unknown")).toBeNull();
  });
});
