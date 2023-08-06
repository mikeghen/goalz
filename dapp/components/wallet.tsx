import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useSigner } from "wagmi";
import { GOALZ_USD_ADDRESS, ERC20_ABI } from '../config/constants';
import { formatTokenAmount } from '../utils/helpers';
import Link from "next/link"; // Import the Link component from Next.js


const Wallet: React.FC<{}> = () => {

  const { address } = useAccount();

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

  // Function to handle adding a new goal row
  const handleAddNewGoalRow = () => {

  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6 mb-4 mb-md-0">
          <h1 className="m-auto text-center md:mt-8  font-extrabold">
            Welcome back to your <br />
            <a href="https://github.com/iMuzz/web3-starter" target="_blank" rel="noreferrer" className="rotating-hue">
              🏆 Goalz
            </a>
          </h1>
          <div className="d-flex justify-content-center mt-3">
            <Link href="/create">
              <a className="btn btn-primary">Add New Goal</a>
            </Link>
          </div>
        </div>
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card">
            <div className="card-header">
              Account Summary
            </div>
            <div className="card-body">
              <table className="table">
                <tbody>
                  <tr>
                    <td>Available:</td>
                    <td>{goalzUsdBalance} USDC</td>
                  </tr>
                  <tr>
                    <td>Deposited:</td>
                    <td>{goalzUsdBalance} glzUSDC</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <br/>
      <style jsx>{`
        .rotating-hue {
          background-image: -webkit-linear-gradient(92deg, #f35626, #feab3a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-animation: hue 30s infinite linear;
        }

        @-webkit-keyframes hue {
          from {
            -webkit-filter: hue-rotate(0deg);
          }
          to {
            -webkit-filter: hue-rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Wallet;
