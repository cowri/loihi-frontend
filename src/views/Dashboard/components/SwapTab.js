import React, { useContext, useState } from 'react'
import styled from 'styled-components'

import BigNumber from 'bignumber.js'

import { bnAmount, displayAmount } from '../../../utils/web3Utils'

import DashboardContext from '../context'

import ModalConfirmMetamask from '../../../components/ModalConfirmMetamask'
import ModalError from '../../../components/ModalError'
import ModalSuccess from '../../../components/ModalSuccess'
import ModalTx from '../../../components/ModalAwaitingTx'

import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import SwapCallsIcon from '@material-ui/icons/SwapCalls';
import { makeStyles, withTheme } from '@material-ui/core/styles'

import Button from '../../../components/Button'


import TokenIcon from '../../../components/TokenIcon'

const StyledStartAdornment = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding-left: 22px;
  padding-right: 12px;
`

const StyledSwapTab = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const StyledLabelBar = withTheme(styled.div`
  align-items: flex-end;
  display: flex;
  height: 32px;
  align-content: baseline;
  margin-top: 24px;
`)

const StyledTitle = styled.div`
  margin-left: 24px;
  font-size: 24px;
  margin-bottom: 4px;
  align-items: center;
`
const StyledAvailability = withTheme(styled.div`
  color: ${props => props.theme.palette.grey[500]};
  margin-left: 8px;
  font-size: 16px;
  margin-bottom: 5px;
`)

const StyledInput = styled.div`
  margin-bottom: 24px;
`

const StyledSwapRow = styled.div`
  position: relative;
  height: 0px;
`

const StyledPriceMessage = styled.div`
font-size: 20px;
padding: 10px;
  height: 0px;
`

const StyledRows = styled.div`
  margin-bottom: 48px;
  margin-top: 24px;
  text-align: center;
`

const StyledWarning = styled.div`
  color: red;
  font-size: 18px;
  width: 80%;
  margin: 20px auto 10px;
`

const StyledActions = withTheme(styled.div`
  align-items: center;
  background-color: ${props => props.theme.palette.grey[50]};
  display: flex;
  height: 80px;
  padding: 0 24px;
  @media (max-width: 512px) {
    padding: 0 12px;
  }
`)

const SwapTab = () => {

  const {
    account,
    allowances,
    contracts,
    updateAllowances,
    updateBalances,
    updateWalletBalances,
    walletBalances,
  } = useContext(DashboardContext)

  console.log("contracts", contracts)

  const viewRevertedValue = '3.963877391197344453575983046348115674221700746820753546331534351508065746944e+75'

  const erc20s = contracts.erc20s
  const loihi = contracts.loihi

  const [step, setStep] = useState('start')
  const [originSlot, setOriginSlot] = useState(0)
  const [targetSlot, setTargetSlot] = useState(3)
  const [originValue, setOriginValue] = useState('0')
  const [targetValue, setTargetValue] = useState('0')
  const [originError, setOriginError] = useState(false)
  const [targetError, setTargetError] = useState(false)
  const [originHelperText, setOriginHelperText] = useState('')
  const [targetHelperText, setTargetHelperText] = useState('')
  const [swapType, setSwapType] = useState('origin')
  const [slippage, setSlippage] = useState(0)
  const [priceMessage, setPriceMessage] = useState('')
  const [txHash, setTxHash] = useState('')


  const origin = erc20s[originSlot]
  const target = erc20s[targetSlot]

  const haltCheckMessage = 'amount triggers halt check'
  const insufficientBalanceMessage = 'amount is greater than your wallet\'s balance'

  const originAvailable = walletBalances[origin.symbol.toLowerCase()]
    ? displayAmount(walletBalances[origin.symbol.toLowerCase()], origin.decimals, 4) : 0
  const targetAvailable = walletBalances[target.symbol.toLowerCase()]
    ? displayAmount(walletBalances[target.symbol.toLowerCase()], target.decimals, 4) : 0

  const initiallyLocked = allowances[origin.symbol.toLowerCase()] === 0
  const [unlocked, setUnlocked] = useState(false)

  const primeSwap = async (swapPayload, slotPayload) => {

    let { origin, target } = setSlots(slotPayload)

    if (swapPayload.type === 'switch') {

      setTargetValue(originValue)
      setOriginValue(targetValue)

      const { theseChickens, thoseChickens } = await getChickens(swapType, swapType === 'origin' ? targetValue : originValue)
      return setPriceIndication(swapType, theseChickens, thoseChickens)

    }

    if (swapPayload.value === '') {
      setOriginValue(swapPayload.value)
      setTargetValue(swapPayload.value)
      return setPriceMessage('')
    }

    return await setSwap (swapPayload)

    async function setSwap (swapPayload)  {

      const value = Number(+swapPayload.value)

      if (swapPayload.type === 'origin'){

        setSwapType(swapPayload.type)
        const { theseChickens, thoseChickens } = await getChickens(swapPayload.type, value)
        setValues(swapPayload.type, theseChickens, thoseChickens)
        setPriceIndication(swapPayload.type, theseChickens, thoseChickens)

      } else if (swapPayload.type === 'target'){

        setSwapType(swapPayload.type)
        const { theseChickens, thoseChickens } = await getChickens(swapPayload.type, value)
        setValues(swapPayload.type, theseChickens, thoseChickens)
        setPriceIndication(swapPayload.type, theseChickens, thoseChickens)

      } 
      
    }

    function setSlots (slotPayload) {
      let origin, target

      console.log("setSlots", arguments)

      if (slotPayload.type === 'origin') {

        setOriginSlot(slotPayload.value)
        origin = erc20s[slotPayload.value]
        target = erc20s[targetSlot]

      } else if (slotPayload.type === 'target') {

        setTargetSlot(slotPayload.value)
        origin = erc20s[originSlot]
        target = erc20s[slotPayload.value]

      } else if (slotPayload.type === 'switch') {

        setOriginSlot(targetSlot)
        setTargetSlot(originSlot)

        origin = erc20s[targetSlot]
        target = erc20s[originSlot]
        
      } else {

        origin = erc20s[originSlot]
        target = erc20s[targetSlot]

      }

      return { origin, target }

    }

    async function getChickens (type, value) {

      let theseChickens, thoseChickens

      if (value === 0) {

        setOriginValue(0)
        setTargetValue(0)
        theseChickens = new BigNumber(0)
        thoseChickens = new BigNumber(0)

      } else if (type === 'origin') {

        setOriginValue(value)

        theseChickens = origin.getNumeraireFromDisplay(value)

        thoseChickens = target.getNumeraireFromRaw( await loihi.viewOriginSwap(
          origin.address,
          target.address,
          origin.getRawFromNumeraire(theseChickens)
        ))

      } else if (type === 'target') {

        setTargetValue(value)

        theseChickens = target.getNumeraireFromDisplay(value)

        thoseChickens = origin.getNumeraireFromRaw( await loihi.viewTargetSwap(
          origin.address,
          target.address,
          target.getRawFromNumeraire(theseChickens)
        ))

      }

      return { theseChickens, thoseChickens }

    }


    function setValues (type, theseChickens, thoseChickens) {

      const availableOrigin = walletBalances[origin.symbol.toLowerCase()]
      
      if (thoseChickens.comparedTo(viewRevertedValue) === 0) {
        
        type === 'origin' ? setOriginError(true) : setTargetError(true)
        type === 'origin' ? setTargetValue('') : setOriginValue('')
        type === 'origin' ? setOriginHelperText(haltCheckMessage) : setTargetHelperText(haltCheckMessage)

        return
        
      } 

      if (type === 'origin') {

        setTargetHelperText('')
        setTargetError(false)

        if (theseChickens.isGreaterThan(availableOrigin)) {
          setOriginError(true)
          setOriginHelperText(insufficientBalanceMessage)
        } else {
          setOriginError(false)
          setOriginHelperText('')
        }
        
        setTargetValue(origin.getDisplayFromNumeraire(thoseChickens, 4))

      } else if (type === 'target') {

        setOriginHelperText('')
        setOriginError(false)

        if (thoseChickens.isGreaterThan(availableOrigin)) {

          setTargetHelperText('equivalent ' + origin.symbol + ' ' + insufficientBalanceMessage)
          setTargetError(true)

        } else {

          setTargetHelperText('')
          setTargetError(false)

        }

        setOriginValue(origin.getDisplayFromNumeraire(thoseChickens, 4))

      }
    }

    async function setPriceIndication (type, theseChickens, thoseChickens) {

      const reverted = '3.963877391197344453575983046348115674221700746820753546331534351508065746944e+75'
      if (theseChickens.comparedTo(reverted) === 0) return setPriceMessage('')
      if (thoseChickens.comparedTo(reverted) === 0) return setPriceMessage('')
      if (theseChickens.isZero() || thoseChickens.isZero()) return setPriceMessage('')

      console.log("these chickens", theseChickens.toFixed())
      console.log("those chickens", thoseChickens.toFixed())

      const oNAmt = type === 'origin' ? theseChickens : thoseChickens
      const tNAmt = type === 'origin' ? thoseChickens : theseChickens

      console.log("oNAmt", oNAmt)
      console.log("tNAmt", tNAmt)

      const tPrice = tNAmt.dividedBy(oNAmt).toFixed(4)

      const oSymbol = origin.symbol
      const tSymbol = target.symbol

      let message = ''
      if (oSymbol === 'cUSDC' || oSymbol === 'cDAI' || oSymbol === 'CHAI') {

        message += '$1.00 of ' + oSymbol + ' is worth '

      } else {

        message += '1.0000 ' + oSymbol + ' is worth '

      }

      if (tSymbol === 'cUSDC' || tSymbol === 'cDAI' || tSymbol === 'CHAI') {

        message += '$' + tPrice + ' of ' + tSymbol + ' for this trade'

      } else {

        message += tPrice + ' ' + tSymbol + ' for this trade'
        
      }

      setPriceMessage(message)

    }

  }

  const handleSwap = async (e) => {

    e.preventDefault()

    setStep('confirmingMetamask')

    let originInput, targetInput
    if (swapType === 'origin') {

      originInput = origin.getRawFromDisplay(originValue)

      const targetNumeraire = target.getNumeraireFromDisplay(targetValue)
        .multipliedBy(new BigNumber(.99))

      targetInput = target.getRawFromNumeraire(targetNumeraire)

    } else {

      const originNumeraire = origin.getNumeraireFromDisplay(originValue)
        .multipliedBy(new BigNumber(1.01))

      originInput = origin.getRawFromNumeraire(originNumeraire)

      targetInput = target.getRawFromDisplay(targetValue)

    }

    const tx = loihi[swapType === 'origin' ? 'originSwap' : 'targetSwap'](
      origin.address,
      target.address,
      originInput,
      targetInput,
      Math.floor((Date.now()/1000) + 900)
    )

    tx.send({ from: account })
      .once('transactionHash', handleTransactionHash)
      .once('confirmation', handleConfirmation)
      .on('error', handleError)

    function handleTransactionHash (hash) {
      setTxHash(hash)
      setStep('swapping')
    }

    function handleConfirmation () {
      setOriginValue('0')
      setTargetValue('0')
      setStep('success')
      updateBalances()
      updateWalletBalances()
    }

    function handleError () {
      setStep('error')
    }

  }

  const handleUnlock = async () => {

    setStep('confirmingMetamask')

    const tx = origin.methods.approve(loihi.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935")

    tx.send({ from: account })
      .once('transactionHash', onTxHash)
      .once('confirmation', onConfirmation)
      .on('error', onError)

    function onTxHash (hash) {
      setTxHash(hash)
      setStep('unlocking')
    }

    function onConfirmation () {
      setStep('unlockSuccess')
      setUnlocked(true)
      updateAllowances()
    }

    function onError () {
      setStep('error')
    }

  }

  const handleOriginSelect = e => {
    e.preventDefault()
    if (e.target.value !== targetSlot) {
      const swapPayload = { type: swapType, value: swapType === 'origin' ? originValue : targetValue }
      const slotPayload = { type: 'origin', value: e.target.value }
      primeSwap(swapPayload, slotPayload)
    } else primeSwap({type: 'switch'}, {type: 'switch'})
  }

  const handleTargetSelect = e => {
    e.preventDefault()
    if (e.target.value !== originSlot) {
      const swapPayload = { type: swapType, value: swapType === 'origin' ? originValue : targetValue }
      const slotPayload = { type: 'target', value: e.target.value }
      primeSwap(swapPayload, slotPayload)
    } else primeSwap({type: 'switch' }, {type: 'switch' })
  }

  const handleOriginInput = e => {
    e.preventDefault()
    const swapPayload = { type: 'origin', value: e.target.value }
    primeSwap(swapPayload, {})
  }

  const handleTargetInput = e => {
    e.preventDefault()
    const swapPayload = { type: 'target', value: e.target.value }
    primeSwap(swapPayload, {})
  }

  const selectionClass = makeStyles({
    root: { 'fontSize': '22px' }
  })()

  const selections = [
      <MenuItem className={selectionClass.root} key={0} value={0} > { erc20s[0].symbol } </MenuItem>,
      <MenuItem className={selectionClass.root} key={1} value={1} > { erc20s[1].symbol } </MenuItem>,
      <MenuItem className={selectionClass.root} key={2} value={2} > { erc20s[2].symbol } </MenuItem>,
      <MenuItem className={selectionClass.root} key={3} value={3} > { erc20s[3].symbol } </MenuItem>,
  ]

  const getDropdown = (handler, value) => {

    const dropdownStyles = makeStyles({ root: { fontSize: '22px'} })()

    return ( <TextField select
      SelectProps={{className: dropdownStyles.root }}
      children={selections}
      onChange={e => handler(e)}
      value={value}
    /> )

  }

  const iconClasses = makeStyles({
      root: { position: 'absolute', right: '12.5px', top: '-25px' }
  }, { name: 'MuiIconButton' })()


  let toolTipMsg = ''

  if (originError){ 

    if (originError === haltCheckMessage) toolTipMsg = 'This amount triggers safety halts'

    else toolTipMsg = 'Your wallet has insufficient ' + origin.symbol 

  } else if (targetError) {

    if (targetError === haltCheckMessage) toolTipMsg = 'This amount triggers safety halts'

    else toolTipMsg = 'Your wallet has insufficient ' + origin.symbol 

  }

  if (initiallyLocked && !unlocked) {

    toolTipMsg = 'You must unlock ' + origin.symbol + ' to swap'

  }

  const inputStyles = makeStyles({
    inputBase: { fontSize: '22px', height: '60px' },
    helperText: {
      color: 'red', 
      fontSize: '16px',
      marginLeft: '25px'
    }
  })()

  return (

    <StyledSwapTab>
      { step === 'confirmingMetamask' && <ModalConfirmMetamask /> }
      { (step === 'swapping' || step === 'unlocking') && <ModalTx tx={txHash} /> }
      { step === 'success' && <ModalSuccess buttonBlurb={'Finish'} onDismiss={() => setStep('none')} title={'Swap Successful.'}/> }
      { step === 'unlockSuccess' && <ModalSuccess buttonBlurb={'Finish'} onDismiss={() => setStep('none')} title={'Unlocking Successful.'}/> }
      { step === 'error' && <ModalError buttonBlurb={'Finish'} onDismiss={() => setStep('none')} title={'An error occurred.'} />}
      <StyledRows>
        <StyledWarning> This is an unaudited product, so please only use nonessential funds. The audit is currently under way. </StyledWarning>
        <AmountInput 
          available={originAvailable}
          error={originError}
          icon={origin.icon}
          helperText={originHelperText}
          onChange={e => handleOriginInput(e)}
          selections={getDropdown(handleOriginSelect, originSlot)}
          styles={inputStyles}
          symbol={origin.symbol}
          title={'From'}
          value={originValue}
        />
        <StyledSwapRow>
          <IconButton 
            className={iconClasses.root} 
            onClick={e=> primeSwap({type:'switch'}, {type:'switch'})}
          >
            <SwapCallsIcon fontSize={'large'}/>
          </IconButton>
        </StyledSwapRow>
        <AmountInput 
          available={targetAvailable}
          error={targetError}
          icon={target.icon}
          helperText={targetHelperText}
          onChange={e => handleTargetInput(e)}
          selections={getDropdown(handleTargetSelect, targetSlot)}
          styles={inputStyles}
          symbol={target.symbol}
          title={'To'}
          value={targetValue}
        /> 
        <StyledPriceMessage> { priceMessage } </StyledPriceMessage>
        <>
          { slippage === 0 ? '' : slippage < 0 ? 'slippage: ' + slippage : 'anti-slippage:' + slippage }
        </>
      </StyledRows>
      <StyledActions>
        <Tooltip arrow={true} placement={'top'} title={toolTipMsg} style={targetError || originError || (initiallyLocked && !unlocked) ? { cursor: 'no-drop'} : null } >
          <div>
            <Button disabled={(targetError || originError || (initiallyLocked && !unlocked))}
              onClick={handleSwap}
              outlined={initiallyLocked && !unlocked}>
                Swap
            </Button> 
          </div>
        </Tooltip>
        <div style={{ width: 12 }} />
        { (initiallyLocked && !unlocked) ? <Button onClick={handleUnlock}> Unlock { origin.symbol } </Button> : null } 
      </StyledActions>
    </StyledSwapTab>
  )
}


const AmountInput = ({
  available,
  icon,
  error,
  helperText,
  onChange,
  styles,
  symbol,
  title,
  value,
  selections
}) => {

  return (
    <StyledInput>
      <StyledLabelBar>
        <StyledTitle> { title } </StyledTitle>
        <StyledAvailability>Available: {available} {symbol}</StyledAvailability>
      </StyledLabelBar>
      <TextField fullWidth
        error={error}
        FormHelperTextProps={{className: styles.helperText}}
        helperText={helperText}
        min="0"
        onChange={onChange}
        onKeyDown={e => { if (e.keyCode === 189) e.preventDefault() }}
        placeholder="0"
        value={value}
        type="number"
        InputProps={{
          className: styles.inputBase,
          endAdornment: ( 
            <div style={{ marginRight: 6 }}> 
              { selections } 
            </div>
          ),
          startAdornment: (
            <StyledStartAdornment>
              <TokenIcon > <img src={icon} alt="" /> </TokenIcon>
            </StyledStartAdornment>
          )
        }}
      />
    </StyledInput>
  )
}

export default SwapTab