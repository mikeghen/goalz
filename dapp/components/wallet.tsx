import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBlockNumber } from "wagmi";
import { GOALZ_USDC_ADDRESS, GOALZ_WETH_ADDRESS, USDC_ADDRESS, WETH_ADDRESS, ERC20_ABI } from '../config/constants';
import { formatTokenAmount } from '../utils/helpers';
import Link from "next/link";
import { useQueryClient } from '@tanstack/react-query';

const Wallet: React.FC<{}> = () => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [goalzUsdBalance, setGoalzUsdBalance] = useState("0.00");
  const [goalzWethBalance, setGoalzWethBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [wethBalance, setWethBalance] = useState("0.00");

  const goalzUsdBalanceData = useReadContract({
    address: GOALZ_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const goalzWethBalanceData = useReadContract({
    address: GOALZ_WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const usdcBalanceData = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],

  });

  const wethBalanceData = useReadContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  useEffect(() => {
    if (goalzUsdBalanceData.data) {
      setGoalzUsdBalance(formatTokenAmount(goalzUsdBalanceData.data.toString(), 6, 2));
    }
    if (goalzWethBalanceData.data) {
      setGoalzWethBalance(formatTokenAmount(goalzWethBalanceData.data.toString(), 18, 2));
    }
    if (usdcBalanceData.data) {
      setUsdcBalance(formatTokenAmount(usdcBalanceData.data.toString(), 6, 2));
    }
    if (wethBalanceData.data) {
      setWethBalance(formatTokenAmount(wethBalanceData.data.toString(), 18, 2));
    }
  }, [goalzUsdBalanceData.data, goalzWethBalanceData.data, usdcBalanceData.data, wethBalanceData.data, blockNumber]);

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
            &nbsp;&nbsp;
            <Link href="/">
              <a className="btn btn-primary">View Goalz</a>
            </Link>
          </div>
        </div>
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              Account Summary
            </div>
            <div className="card-body">
              <table className="table">
                <tbody>
                  <tr>
                    <td></td>
                    <td>USDC</td>
                    <td>WETH</td>
                  </tr>
                  <tr>
                    <td>Available:</td>
                    <td>{usdcBalance}</td>
                    <td>{wethBalance}</td>
                  </tr>
                  <tr>
                    <td>Deposited:</td>
                    <td>{goalzUsdBalance}</td>
                    <td>{goalzWethBalance}</td>
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