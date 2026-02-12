import { categories } from '@/data/oposiciones';
import { CatalogClient } from '@/components/oposiciones/catalog-client';

export default async function OposicionesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const requestedCategory = params.category;
  const validCategory =
    requestedCategory && categories.some((category) => category.name === requestedCategory)
      ? requestedCategory
      : 'Todas';

  return <CatalogClient initialCategory={validCategory} />;
}
