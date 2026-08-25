import { Link } from "react-router-dom";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link className="brand" to="/" aria-label="NövbəTime ana səhifə">
      <span className="brand__mark" aria-hidden="true">
        <img
          className="brand__logo"
          src="/novbetime-logo.png"
          alt=""
          width="512"
          height="512"
        />
      </span>
      {!compact && <span className="brand__name">NövbəTime</span>}
    </Link>
  );
}
