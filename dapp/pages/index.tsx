import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Toaster } from 'react-hot-toast'

import Navbar from '../components/navbar'
import ViewGoals from '../components/viewGoals'
import CreateGoals from '../components/createGoals'
import Wallet from '../components/wallet'

import 'bootstrap/dist/css/bootstrap.min.css';

const Home: NextPage = () => {
  return (
    <div className="container max-w-screen-xl m-auto pb-4 md:pb-12">
      <Head>
        <title>Goalz</title>
        <meta name="description" content="Goalz" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />
      <Navbar />

      <Wallet />
      <br />
      <ViewGoals />
      <br />
      <CreateGoals /> 

    </div>
  )
}

export default Home
