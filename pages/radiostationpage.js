import { useRouter } from 'next/router';
import RadioStationPage from '../components/RadioStationPage'; // adjust the path as necessary

function WalletAddressPage() {
  const router = useRouter();
  const { walletaddress } = router.query;

  return (
    <div>
      <RadioStationPage walletAddress={walletaddress} />
    </div>
  );
}

export default WalletAddressPage;
