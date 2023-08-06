import type { NextPage } from 'next'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import Navbar from '../components/navbar'
import CreateGoals from '../components/createGoals'

import 'bootstrap/dist/css/bootstrap.min.css';

const Create: NextPage = () => {
    return (
      <div className="container max-w-screen-xl m-auto pb-4 md:pb-12">
        <Head>
          <title>Goalz | Create Goal</title>
          <meta name="description" content="Goalz" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Toaster />
        <Navbar />
  
        <CreateGoals />
  
      </div>
    )
  }

export default Create