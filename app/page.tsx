import Header from '@/components/Header/Header';
import { Hero } from '@/components/Hero';

export default async function Index({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div>
      {/* <Header /> */}
      <Hero searchParams={searchParams} />
    </div>
  );
}
