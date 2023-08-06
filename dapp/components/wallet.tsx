import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useSigner } from "wagmi";
import { GOALZ_USD_ADDRESS, ERC20_ABI } from '../config/constants';
import { formatTokenAmount } from '../utils/helpers';

const Wallet: React.FC<{}> = () => {

  const {address} = useAccount();
  const { data: signer } = useSigner();

  const [goalzUsdBalance, getGoalzUsdBalance] = useState("0.00");

  const goalzUsdBalanceData = useContractRead({
    addressOrName: GOALZ_USD_ADDRESS,
    contractInterface: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  useEffect(() => {
    if (goalzUsdBalanceData.data) {
      getGoalzUsdBalance(formatTokenAmount(goalzUsdBalanceData.data, 18, 6));
    }
  }, [goalzUsdBalanceData.data]);


      
  return (
    <div>
      <div className="card">
        <div className="card-header">
          Balances
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div className="d-flex flex-wrap align-items-center">
              <div className="mr-3">
                Goalz USD
              </div>
              <div className="mr-3">
              <span>{goalzUsdBalance}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
