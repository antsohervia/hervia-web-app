import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

export function PaginationBar({ page, pageSize, total, searchParams }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground mt-3">
        {total} tenant{total > 1 ? "s" : ""}
      </p>
    );
  }

  function href(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-muted-foreground">
        Page {page} / {totalPages} · {total} tenants
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page <= 1}
          aria-disabled={page <= 1}
        >
          <Link href={page > 1 ? href(page - 1) : "#"}>Précédent</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          aria-disabled={page >= totalPages}
        >
          <Link href={page < totalPages ? href(page + 1) : "#"}>Suivant</Link>
        </Button>
      </div>
    </div>
  );
}
