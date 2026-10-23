# REQUESTS from RA (theme + shell) to other lanes

Not committed. Read with the RA PR description.

## For B2 (taxonomy hub, src/components/board/taxonomy-hub.tsx)
- The footer Jobs column links to `/jobs#job-types`, `/jobs#locations`,
  `/jobs#levels` and `/jobs#languages` (board-only mode, nav.ts). Please give
  the four Group sections on the /jobs hub the matching ids (job-types,
  locations, levels, languages). Without ids the links still load /jobs but
  do not scroll.

## For B1 (board list)
- Header/footer are in BoardShell. BoardShell now accepts `fullBleed?: boolean`.
  With fullBleed the children render edge to edge and must add their own
  frame (`mx-auto w-full max-w-board px-4`). Hero uses `bg-primary text-primary-foreground`.
- PostJobCard is `PostJobCard({ priceLabel, durationDays })`; render it only
  when `settings.postJob.enabled`.

## For C1 and C2
- Use `max-w-board` for frames and `.bordful-prose` for markdown bodies.
- Footer/header are owned by RA; if you need a change there, ask here.
