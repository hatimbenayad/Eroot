# Unit U3 Acceptance Tests

Traceability: `US-004` (`#17`), `FR-005`, `FR-008`, `FR-012`, `FR-013`, `FR-014`, `FR-015`.

## AT-U3-01 — Add-Slide Modal Groups & No AI Generate Tab
- **Given** the creator clicks `+ Add` in the slide sidebar
- **When** `AddSlideModal` opens
- **Then** tabs `Add`, `Find`, and `Import` appear (no `Generate` tab), the `Add` tab groups types into *Test knowledge*, *Collect opinions*, and *Media slides*, and picking `True or false` or `Poll` or `Classic` inserts that slide immediately.

## AT-U3-02 — Quiz 2–6 Options & Sanitization
- **Given** a `Quiz` slide with 6 options (2 filled + 1 correct, or 6 filled + 2 correct)
- **When** passed to `sanitizeSlideForPlayer`
- **Then** `isCorrect` is stripped from every option and empty optional slots are omitted.

## AT-U3-03 — Poll & Classic Zero-Point Enforcement
- **Given** a `Poll` or `Classic` slide
- **When** inspected in `PropertiesPanel` and `CreatorPreviewModal`
- **Then** points are locked to `No points (0)` and Poll/Classic render without correct-answer indicators.

## AT-U3-04 — Type Switching Preserves Compatible Content
- **Given** a `Quiz` slide with title `"Favorite color?"` and 4 options
- **When** switched to `Poll` via `Question type` dropdown
- **Then** the question title and up to 4 option texts remain intact while `isCorrect` flags are removed.

