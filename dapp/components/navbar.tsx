import DarkModeToggle from './darkModeToggle'
import ConnectWallet from './connectWallet'
import Link from 'next/link'

interface IProps {
  displayConnectButton?: boolean
  isDarkModeToggleVisible?: boolean
}

/**
 * Navigation bar that enables connect/disconnect from Web3.
 */
const Navbar = ({
  isDarkModeToggleVisible = false,
  displayConnectButton = true,
}: // isNetworkSwitcherVisible = true,
IProps) => {
  return (
    <nav className="flex justify-between w-full py-8">
      <div className="container-fluid flex space-x-2">
        {/* Logo */}
        <div className="ml-1 transition duration-200 transform hover:rotate-20">
          <Link href="/view">
            <h1 className="text-2xl text-dark font-bold mr-auto"><span className="rotating-hue">🏆</span> Goalz</h1>
          </Link>
        </div>

        {/* Navigation links */}
        {/* <ul className="flex items-center space-x-4">
          <li>
            <Link href="/create">
              <a>Create +</a>
            </Link>
          </li>
        </ul> */}

         {/* Connect to web3, dark mode toggle */}
        <div className="flex items-center space-x-2">
          {isDarkModeToggleVisible && <DarkModeToggle />}
          {displayConnectButton && <ConnectWallet />}
        </div>
      </div>

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
    </nav>
  )
}

export default Navbar

