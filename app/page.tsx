import TravelApp from '../components/TravelApp';
import PasswordGate from '../components/PasswordGate';

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
  <PasswordGate>
    <TravelApp
      days={days}
      documents={documents}
      packingItems={packingItems}
    />
  </PasswordGate>
);
}
