import TournamentDetailClient from './client';

export async function generateStaticParams() {
  return [];
}

export default function TournamentDetailPage() {
  return <TournamentDetailClient />;
}
