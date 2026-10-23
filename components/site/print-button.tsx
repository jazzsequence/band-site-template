"use client";

import { Button } from "../../design-system/components/Button";

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      Print ticket
    </Button>
  );
}
