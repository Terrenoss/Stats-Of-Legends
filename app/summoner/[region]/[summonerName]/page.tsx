
import { Metadata } from 'next';
import SummonerClientPage from './SummonerClientPage';

export async function generateMetadata(props: { params: Promise<{ region: string, summonerName: string }> }): Promise<Metadata> {
  const params = await props.params;
  const name = decodeURIComponent(params.summonerName).split('-')[0];
  return {
    title: `${name} - Stats Of Legends`,
    description: `View match history, stats, and AI analysis for ${name} on ${params.region}.`,
  };
}

// We delegate the client-side logic to a separate component to allow this page to be a Server Component for metadata
export default async function Page(props: { params: Promise<{ region: string, summonerName: string }> }) {
  const params = await props.params;
  return <SummonerClientPage params={params} />;
}
