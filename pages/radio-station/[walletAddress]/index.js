// /pages/radio-station/[walletAddress]/index.js

import { useRouter } from 'next/router'
import RadioStationPage from '../../../components/RadioStationPage';

const RadioStationWrapper = () => {
  const router = useRouter();
  const { walletAddress } = router.query;

  // Check if walletAddress is not defined yet
  if (!walletAddress) {
    return <div>Loading...</div>; // Loading state, could be a spinner component
  }

  // Pass walletAddress as a prop to the RadioStationPage
  return <RadioStationPage walletAddress={walletAddress} />;
}

export default RadioStationWrapper;
