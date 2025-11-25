
import { Metadata } from 'next';
import SummonerClientPage from './SummonerClientPage';

export async function generateMetadata({ params }: { params: { region: string, summonerName: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.summonerName).split('-')[0];
  return {
    title: `${name} - Stats Of Legends`,
    description: `View match history, stats, and AI analysis for ${name} on ${params.region}.`,
  };
}

// We delegate the client-side logic to a separate component to allow this page to be a Server Component for metadata
export default function Page({ params }: { params: { region: string, summonerName: string } }) {
    return <SummonerClientPage params={params} />;
}
