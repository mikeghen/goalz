import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBlockNumber } from 'wagmi'
import { ERC20_ABI, getNetworkAddresses } from '../config/constants'
import { formatTokenAmount } from '../utils/helpers'
import Link from 'next/link'

const Wallet: React.FC = () => {
  const { address, chain } = useAccount()
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const [goalzUsdBalance, setGoalzUsdBalance] = useState('0.00')
  const [goalzWethBalance, setGoalzWethBalance] = useState('0.00')
  const [usdcBalance, setUsdcBalance] = useState('0.00')
  const [wethBalance, setWethBalance] = useState('0.00')

  const addresses = chain ? getNetworkAddresses(chain.id) : {}

  const goalzUsdBalanceData = useReadContract({
    address: addresses.GOALZ_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  })

  const goalzWethBalanceData = useReadContract({
    address: addresses.GOALZ_WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  })

  const usdcBalanceData = useReadContract({
    address: addresses.USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  })

  const wethBalanceData = useReadContract({
    address: addresses.WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  })

  useEffect(() => {
    if (goalzUsdBalanceData.data) {
      setGoalzUsdBalance(formatTokenAmount(goalzUsdBalanceData.data.toString(), 6, 2))
    }
    if (goalzWethBalanceData.data) {
      setGoalzWethBalance(formatTokenAmount(goalzWethBalanceData.data.toString(), 18, 2))
    }
    if (usdcBalanceData.data) {
      setUsdcBalance(formatTokenAmount(usdcBalanceData.data.toString(), 6, 2))
    }
    if (wethBalanceData.data) {
      setWethBalance(formatTokenAmount(wethBalanceData.data.toString(), 18, 2))
    }
  }, [goalzUsdBalanceData.data, goalzWethBalanceData.data, usdcBalanceData.data, wethBalanceData.data, blockNumber])

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6 mb-4">
          <h1 className="text-center font-extrabold">🏆 Goalz</h1>
          <div className="d-flex justify-content-center mt-3">
            <Link href="/create">
              <a className="btn btn-primary me-2">Add New Goal</a>
            </Link>
            <Link href="/">
              <a className="btn btn-primary">View Goalz</a>
            </Link>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card border-success">
            <div className="card-header bg-success text-white">Account Summary</div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th>USDC</th>
                      <th>WETH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Available:</th>
                      <td>{usdcBalance}</td>
                      <td>{wethBalance}</td>
                    </tr>
                    <tr>
                      <th>Deposited:</th>
                      <td>{goalzUsdBalance}</td>
                      <td>{goalzWethBalance}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <style global jsx>{`
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
  )
}

export default Wallet
