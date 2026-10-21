---
name: AutoDoc 2.0 Workspace
colors:
  primary: "#059669"
  surface: "#ffffff"
  background: "#f8fafc"
  text: "#0f172a"
  secondary: "#475569"
  border: "#e2e8f0"
typography:
  body: { fontFamily: Segoe UI, fontSize: 13px, fontWeight: 400, lineHeight: 1.5 }
  title: { fontFamily: Segoe UI, fontSize: 16px, fontWeight: 700, lineHeight: 1.4 }
rounded: { sm: 8px, md: 12px, lg: 16px }
spacing: { xs: 4px, sm: 8px, md: 16px, lg: 24px }
components:
  card: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: 20px }
---

## Overview
Vietnamese document-production workspace, retaining the existing emerald identity,
native HTML/CSS/ES modules and extension version 2.0.

## Colors
Existing semantic CSS variables define light and dark themes. Green identifies
the primary action; warning and error colors indicate validation results.

## Typography
Use local system fonts with Vietnamese coverage. Word output retains its
independent Times New Roman setting.

## Layout
Equal-width template and data panels on desktop, one column in the side panel.
Align headings, source switches, fields and actions. Export settings use a
responsive grid. Only the preview table, not the page, scrolls horizontally.

## Elevation & Depth
Use existing borders and subtle shadows, without decorative animation.

## Shapes
Consistent input and button radii, larger radii for cards.

## Components
One file-picker handler per dropzone, with keyboard and drop support.
Cancel closes the picker without reopening it. Preview precedes export.
Selection survives filtering; select-all affects visible rows only.
Export never overwrites source data. Saving preview edits is an explicit library
copy action; repeated saves in the same preview update that copy.
Live Sheet previews display the last successful read time and provide an explicit
refresh action. Refresh failures or unsaved edits must never silently replace
the current data.

## Do's and Don'ts
Keep app.html and sidepanel.html consistent. Preserve imported Unicode.
Do not offer PDF until a real converter is implemented.
