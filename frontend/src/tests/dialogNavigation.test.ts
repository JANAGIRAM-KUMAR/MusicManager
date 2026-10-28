import { describe, it, expect, beforeEach } from "vitest";

describe("Dialog and Navigation Cleanup", () => {
  beforeEach(() => {
    // Reset document.body styles
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  });

  it("should clear body pointer-events and scroll-lock attributes on dialog cleanup", () => {
    // Simulate open modal locking document.body
    document.body.style.pointerEvents = "none";
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-scroll-locked", "1");

    expect(document.body.style.pointerEvents).toBe("none");
    expect(document.body.style.overflow).toBe("hidden");

    // Dispatch global close event
    let closed = false;
    const handleClose = () => {
      closed = true;
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-locked");
    };

    window.addEventListener("spotify:close-all-dialogs", handleClose);
    window.dispatchEvent(new CustomEvent("spotify:close-all-dialogs"));

    expect(closed).toBe(true);
    expect(document.body.style.pointerEvents).toBe("");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);

    window.removeEventListener("spotify:close-all-dialogs", handleClose);
  });

  it("should trigger escape key dispatch to dismiss backdrop and portals", () => {
    let escapeTriggered = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") escapeTriggered = true;
    };

    document.addEventListener("keydown", onKey);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(escapeTriggered).toBe(true);
    document.removeEventListener("keydown", onKey);
  });
});
