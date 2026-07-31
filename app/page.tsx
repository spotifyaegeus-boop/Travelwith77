import TravelApp from '../components/TravelApp';

import {
  getTravelData,
  getTravelDocuments,
  getPackingItems,
} from '../lib/travel';

export default async function Page() {
  const [days, documents, packingItems] = await Promise.all([
    getTravelData(),
    getTravelDocuments(),
    getPackingItems(),
  ]);

  return (
    <TravelApp
      days={days}
      documents={documents}
      packingItems={packingItems}
    />
  );
}
