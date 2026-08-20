import { Link } from "react-router-dom";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link className="brand" to="/" aria-label="E-Növbə ana səhifə">
      <span className="brand__mark" aria-hidden="true">
        eN
      </span>
      {!compact && <span className="brand__name">E-Növbə</span>}
    </Link>
  );
}
