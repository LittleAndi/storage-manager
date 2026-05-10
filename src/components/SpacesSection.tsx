import SpaceCard, { type SpaceCardProps } from "./SpaceCard";

export interface SpacesSectionProps {
  title: string;
  spaces: SpaceCardProps[];
  emptyMessage?: string;
}

export function SpacesSection({ title, spaces, emptyMessage }: SpacesSectionProps) {
  if (!spaces.length) {
    if (!emptyMessage) return null;
    return (
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {title} <span className="opacity-60">(0)</span>
        </h3>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </section>
    );
  }
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title} <span className="opacity-60">({spaces.length})</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {spaces.map((s) => (
          <SpaceCard key={s.id} {...s} />
        ))}
      </div>
    </section>
  );
}

export default SpacesSection;
