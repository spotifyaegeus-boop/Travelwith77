import TravelApp from '../components/TravelApp';import {getTravelData} from '../lib/travel';export default async function Page(){const days=await getTravelData();return <TravelApp days={days}/>}
