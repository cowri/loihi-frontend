import React from 'react'
import styled from 'styled-components'

import Footer from '../../components/Footer'
import Header from '../../components/Header'

import withWallet from '../../containers/withWallet'

import DashboardContent from './components/DashboardContent'
import NetworkModal from './components/NetworkModal'
import UnlockModal from './components/UnlockModal'

import DashboardContext from './context'

const StyledDashboard = styled.div`
  align-items: center;
  background: radial-gradient(circle at top, #00fff3 -0%, #0043ff, #000079);
  background-size: cover;
  background-position: center center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Dashboard = ({
  account,
  balances,
  hasMetamask,
  isUnlocked,
  networkId,
  reserves,
  onEnable,
  web3,
}) => {

  const renderContent = () => {
    if (!hasMetamask) {
      return <span style={{ color: '#FFF' }}>Metamask not found.</span>
    }
    if (networkId !== 1) {
      return <NetworkModal />
    }
    if (!isUnlocked) {
      return <UnlockModal />
    }

    return <DashboardContent />
  }

  return (
    <DashboardContext.Provider value={{
      account,
      balances,
      onEnable,
      reserves,
      web3,
    }}>
      <StyledDashboard>
        <Header />
        {renderContent()}
        <Footer />
      </StyledDashboard>
    </DashboardContext.Provider>
  )
}

export default withWallet(Dashboard)