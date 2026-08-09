import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>LearnSphere</h1>
      <p>Enterprise School Learning Management System</p>
      <Link href="/login">Login</Link>
    </main>
  );
}
