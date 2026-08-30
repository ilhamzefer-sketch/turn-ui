import { Button } from "../../shared/ui/Button";

export function AdminPagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <nav className="admin-pagination" aria-label="Səhifələr"><Button variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>Əvvəlki səhifə</Button><span>{page + 1} / {totalPages}</span><Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Növbəti səhifə</Button></nav>;
}
