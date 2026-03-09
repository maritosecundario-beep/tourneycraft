import { TournamentDetailView } from './tournament-detail-view';

/**
 * @fileOverview Server Component for Tournament Details.
 * 
 * This file handles the static parameter generation required for static export
 * while hosting the client-side logic in a separate component.
 */

export async function generateStaticParams() {
  // We return an empty array for static export because tournament data is 
  // exclusively managed on the client side (localStorage/Firestore).
  return []; 
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TournamentDetailView id={resolvedParams.id} />;
}
