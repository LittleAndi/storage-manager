import SpaceCard, { type SpaceCardProps } from "./SpaceCard";

export interface SpacesSectionProps {
  title: string;
  spaces: SpaceCardProps[];
  emptyMessage?: string;
}

/**
 * Grouped list of spaces under a labeled section with a count badge.
 */
export function SpacesSection({ title, spaces, emptyMessage }: SpacesSectionProps) {
  if (!spaces.length) {
    if (!emptyMessage) return null;
    return (
      <section className="space-y-2">
        <h3 className="sticky top-0 z-10 bg-background/80 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
          {title} <span className="text-muted-foreground">(0)</span>
        </h3>
        <div className="text-sm text-muted-foreground italic px-2">{emptyMessage}</div>
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <h3 className="sticky top-0 z-10 bg-background/80 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
        {title} <span className="text-muted-foreground">({spaces.length})</span>
      </h3>
      <div className="grid gap-2">
        {spaces.map((s) => (
          <SpaceCard key={s.id} {...s} />
        ))}
      </div>
    </section>
  );
}

export default SpacesSection;
