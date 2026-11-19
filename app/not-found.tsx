import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap notfound">
      <span className="tag tag-orange">404</span>
      <h1>This page took a wrong hop.</h1>
      <p className="muted">The address doesn't match any page. The course map lists every lesson.</p>
      <Link href="/course" className="btn btn-primary">
        Open the course map
      </Link>
    </div>
  );
}
