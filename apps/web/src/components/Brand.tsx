import { Link } from 'react-router-dom'
export function Mark({ size = 33 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      fill="none"
      stroke="#292922"
      strokeWidth="1.7"
      strokeLinejoin="round"
    >
      <path fill="#a38bd3" d="m3 23 17-9 17 9v5l-17 9-17-9z" />
      <path fill="#b9a1e2" d="m3 22 17-9 17 9-17 9z" />
      <path fill="#d6c6ee" d="m3 16 17-9 17 9v5l-17 9-17-9z" />
      <path fill="#c0a3e4" d="m3 15 17-9 17 9-17 9z" />
      <path fill="#cfb7f7" d="m3 10 17-9 17 9v5l-17 9-17-9z" />
      <path fill="#decafa" d="m3 10 17-9 17 9-17 9z" />
      <path d="m15 10 4-2 6 1-5 3z" fill="#54466a" />
    </svg>
  )
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="React, Rendered home">
      <Mark />
      React, Rendered
    </Link>
  )
}
