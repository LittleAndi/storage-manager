# Potential shadcn/ui components to add (not already present in /src/components/ui)

- Tooltip – For icon buttons (e.g., Share / Print / View Labels toggles in SpaceDetail.tsx and navigation icons in src/components/AppShell.tsx).
- DropdownMenu – User avatar actions (logout, profile) in header of AppShell.tsx instead of separate button list.
- Dialog – General modal base; could replace or underpin `CreateBoxModal` and `ShareSpaceModal` instead of only using AlertDialog for sharing.
- Popover – Inline role selector in `ShareSpaceModal` (replacing Select when quick-pick needed) or filter controls in Spaces.tsx.
- HoverCard – Display member details in `MemberList` when hovering a user.
- Command (Command Palette) – Global quick navigation/search (spaces, boxes, items) surfaced from header in AppShell.tsx.
- Tabs – Segment dashboard sections in Dashboard.tsx (e.g., Activity / Spaces / Stats) or future item detail views in ItemDetail.tsx.
- Accordion – Collapsible advanced form sections in CreateSpace.tsx or future box/item metadata panels.
- ScrollArea – Constrain long member or box lists in SpaceDetail.tsx and spaces list in Spaces.tsx.
- Separator – Visual grouping in sidebar / sheet nav in AppShell.tsx and between form sections in CreateSpace.tsx.
- Skeleton – Loading placeholders for spaces ( Spaces.tsx ), boxes ( SpaceDetail.tsx ), profile ( Profile.tsx ).
- Checkbox – Multi-select for future bulk operations in BulkOperations.tsx and selecting boxes/items.
- Table – Structured item list (future) replacing placeholder in BoxDetail.tsx.
- Pagination – For large item or box collections (future in BoxDetail.tsx / src/pages/Spaces.tsx).
- Progress – Feedback during uploads or bulk tasks in BulkOperations.tsx.
- Switch – Toggle label sheet vs boxes in SpaceDetail.tsx instead of a variant outline button.
- Toggle / ToggleGroup – Box view mode (grid/list) or role filter in Spaces.tsx.
- RadioGroup – Role choice in `ShareSpaceModal` (simpler than Select for 2–3 options).
- Textarea – Longer descriptions for spaces (extend form in src/pages/CreateSpace.tsx) or items.
- Slider – Quantity or size range filters for items (future in Spaces.tsx or search UI).
- Calendar / DatePicker – Filter by modified/created date (boxes/items) in Spaces.tsx or SpaceDetail.tsx.
- AspectRatio – Consistent thumbnail sizing in `SpaceCard` and box/item media.
- Breadcrumb – Hierarchical nav (Dashboard > Space > Box) in SpaceDetail.tsx and BoxDetail.tsx.
- ResizablePanel – Split view (boxes list + label preview) in SpaceDetail.tsx.
- ContextMenu – Right-click actions on boxes/items (future in SpaceDetail.tsx and src/pages/BoxDetail.tsx).
- Skeleton + EmptyState pattern – Complement existing conditional renders in Spaces.tsx and SpaceDetail.tsx.

# Existing shadcn/ui primitives and additional internal UI components with potential additional usage spots

- `Button` (also `buttonVariants`)  
  - Replace raw <a> sidebar nav links in `AppShell` with asChild Buttons for consistent focus states.  
  - Convert emoji action buttons (Print / View Labels toggle / Back arrow) in `SpaceDetail` to icon + text Buttons (ghost / outline variants).  
  - Use small variant for Google/Facebook auth buttons in `Auth` to better align vertical rhythm.  
  - Add destructive variant to delete space action in `Spaces` AlertDialog (already partially styled) and future box/item delete flows.

- `Badge`  
  - Show location as a Badge on each space card in `SpaceCard`.  
  - Tag roles in activity entries (future) in `ActivityFeed`.  
  - Display box counts (e.g. “3 boxes”) in sections of `SpacesSection` if added.

- Card suite: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`  
  - Wrap dashboard stats (future) in `Dashboard`.  
  - Use for Box detail summary in future `BoxDetail`.  
  - Activity panel in `Dashboard` could move into a Card with header/title.

- `Alert`, `AlertTitle`, `AlertDescription`  
  - Inline form errors or success notices in `CreateSpace` (e.g., upload failure).  
  - Permission warnings (viewer editing attempt) in future item/box pages.  
  - Network/offline banner at top of `AppShell`.

- `AlertDialog` family (`AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`)  
  - Confirm leaving unsaved form in `CreateSpace`.  
  - Confirm box deletion in future `BoxDetail`.  
  - Confirm logout instead of immediate action in `AppShell` (optional).

- `Sheet` (`SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`)  
  - Mobile filter / sort panel on spaces list in `Spaces`.  
  - Mobile member management panel in `SpaceDetail`.  
  - Bulk action toolbar drawer in `BulkOperations`.

- `Select` (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectSeparator`, `SelectGroup`)  
  - Role dropdown in `ShareSpaceModal` (already using; keep).  
  - Location filter already in `Spaces`; extend with “Sort by” select (name / created).  
  - Future item category selector in `AddItem`.

- Form primitives: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`  
  - Apply to future item creation form in `AddItem`.  
  - Apply to box creation form in `CreateBox` (if not already).  
  - Use `FormDescription` for optional photo guidance in `CreateSpace`.

- `Input`  
  - Replace any plain <input> elements inside modals (e.g., email input in `ShareSpaceModal` if not already the custom Input).  
  - Search bar (future global) in `AppShell`.

- `Label`  
  - Associate with future checkboxes / switches in bulk selection UIs in `BulkOperations`.  
  - Enhance accessibility of file upload field in `CreateSpace`.

- Avatar suite: `Avatar`, `AvatarImage`, `AvatarFallback`  
  - Member list avatars (current custom div) in `MemberList` for visual consistency.  
  - Space owner avatar in cards (optional) in `SpaceCard`.

- Feedback / utility: `Spinner`  
  - Inline loading inside action Buttons (add spinner before text) during async mutations in forms (`CreateSpace`, `ShareSpaceModal`).  
  - Loading placeholder in boxes grid in `SpaceDetail` while fetching boxes.

- Notifications: `Toaster`  
  - Already mounted in `App`; expand usage for success/error messaging in create/share/delete flows (centralize via helper).

- Icons: `TrashIcon`  
  - Replace hard‑coded delete icon (future) beside each space or box in list (e.g., integrate into actions in `Spaces` and boxes grid in `SpaceDetail`).
