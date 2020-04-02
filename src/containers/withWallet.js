import React, { useEffect, useState } from 'react'

import Web3 from 'web3'

import {
  getContracts,
  getReserves,
} from '../utils/web3Utils'

const withWallet = (WrappedComponent) => {
  return (props) => {
    const [web3, setWeb3] = useState()
    const [account, setAccount] = useState()
    const [contracts, setContracts] = useState({})
    const [reserves, setReserves] = useState({})
    const [networkId, setNetworkId] = useState(1)

    /*
    const handleEnable = async () => {
      try {
        const accounts = await window.ethereum.enable()
        setAccount(accounts[0])
      } catch (e) {
        console.log(e)
      }
    }
    */
   const fetchReserves = async () => {
    const reserves = await getReserves(contracts.loihi)
    setReserves(reserves)
   }

   const handleEnable = () => {
     return new Promise((resolve, reject) => {
       window.ethereum.enable()
        .then(accounts => {
          setAccount(accounts[0])
          resolve(accounts)
        })
        .catch(e => reject(e))
     })
   }

    // init web3, account
    useEffect(() => {
      async function init() {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          const accounts = await web3.eth.getAccounts()
          const networkId = await web3.eth.net.getId()

          setNetworkId(networkId)
          setWeb3(web3)
          setAccount(accounts[0])
        }
      }
      init()
    }, [])

    // init contracts
    useEffect(() => {
      if (web3) {
        const contracts = getContracts(web3)
        setContracts(contracts)
      }
    }, [web3])

    // init reserves
    useEffect(() => {
      if (contracts.loihi) {
        fetchReserves()
      }
    }, [contracts])

    return (
      <>
        <WrappedComponent
          {...props}
          account={account}
          hasMetamask={!!window.ethereum}
          isUnlocked={!!account}
          onEnable={handleEnable}
          networkId={networkId}
          reserves={reserves}
          web3={web3}
        />
      </>
    )
  }
}

/*
        {networkId !== 1 && (
          <Modal>
            <ErrorModal error="Wrong Network!" />
          </Modal>
        )}
*/

export default withWallet