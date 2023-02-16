import { ConnectKitButton } from "connectkit";
import {
  Alert,
  AlertIcon,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Wrap,
} from '@chakra-ui/react'
import { BigNumber } from 'ethers'
import { useEffect, useLayoutEffect, useState } from 'react'
import { erc20ABI, useAccount, useContractRead, useContractWrite, useNetwork, usePrepareContractWrite, usePrepareSendTransaction, useSendTransaction } from 'wagmi'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { ReactJsonViewProps } from 'react-json-view'
import { formatUnits, parseUnits, getAddress } from 'ethers/lib/utils.js'
// PAGE UTILS
const parseAmount = (x: string, y: number) => parseUnits(x, y).toString()
const formatAmount = (x: string, y: number) => formatUnits(x, y).toString()

// REACT JSON SETUP
const DynamicReactJson = dynamic(import('react-json-view'), { ssr: false })
const ReactJsonStyle = { maxHeight: '350px', maxWidth: '700px', overflow: 'scroll' }
const ReactJson = ({ src }: { src: ReactJsonViewProps['src'] }) => {
  return <DynamicReactJson src={src} collapsed theme="monokai" style={ReactJsonStyle} />
}

// TYPES
type LifiToken = {
  address: `0x${string}`
  chainId: number
  symbol: string
  decimals: number
  name: string
  priceUSD?: string
  coinKey?: string
  logoURI?: string
  isCustom?: boolean
  isFOT?: boolean
  tags?: string[]
}

type LifiQuote = {
  id: string
  type: string
  action: {
    fromChainId: number
    fromAmount: string
    fromToken: LifiToken
    toChainId: number
    toToken: LifiToken
    slippage: number
    toAddress: `0x${string}`
    fromAddress: `0x${string}`
  }
  estimate: {
    fromAmount: string
    toAmount: string
    toAmountMin: string
    approvalAddress: `0x${string}`
    executionDuration: number
    feeCosts: {
      name: string
      description: string
      amount: string
      percentage: string
      token: LifiToken
      amountUSD: string
    }[]
    gasCosts: {
      type: string
      price: string
      estimate: string
      limit: string
      amount: string
      amountUSD: string
      token: LifiToken
    }[]
    data: {
      fromToken: LifiToken
      toToken: LifiToken
      toTokenAmount: string
      fromTokenAmount: string
      protocols: {
        name: string
        part: number
        fromTokenAddress: `0x${string}`
        toTokenAddress: `0x${string}`
      }[][][]
      estimatedGas: number
    }
    fromAmountUSD: string
    toAmountUSD: string
  }
  tool: string
  toolDetails: {
    key: string
    name: string
    logoURI: string
  }
  includedSteps: LifiQuote[]
  integrator: string
  transactionRequest: {
    data: `0x${string}`
    to: `0x${string}`
    value: `0x${string}`
    from: `0x${string}`
    chainId: 137
    gasPrice: `0x${string}`
    gasLimit: `0x${string}`
  }
} | null

type LifiStatusSide = {
  chainId: number
  txHash: `0x${string}`
  txLink: string
  amount: string
  token: LifiToken
  gasPrice: string
  gasUsed: string
}

type LifiStatus = {
  sending: LifiStatusSide
  receiving: LifiStatusSide
  tool: string
  status: string
  substatus: string
}

// LIFI API CALLS
const getChains = async () => {
  const result = await axios.get('https://li.quest/v1/chains')
  return result.data
}

const getConnections = async ({ fromChain, toChain }) => {
  const result = await axios.get('https://li.quest/v1/connections', {
    params: {
      fromChain,
      toChain,
    },
  })
  return result.data
}

const getQuote = async ({
  fromChain,
  toChain,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
}: {
  fromChain: number | string
  toChain: number | string
  fromToken: string
  toToken: string
  fromAmount: string
  fromAddress: `0x${string}`
}) => {
  const result = await axios.get('https://li.quest/v1/quote', {
    params: {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
    },
  })
  return result.data
}

const getStatus = async ({
  bridge,
  fromChain,
  toChain,
  txHash,
}: {
  bridge: string
  fromChain: number
  toChain: number
  txHash: string
}) => {
  const result = await axios.get('https://li.quest/v1/status', {
    params: {
      bridge,
      fromChain,
      toChain,
      txHash,
    },
  })
  return result.data
}

// PAGE FUNCTION
export default function LiFi() {
  // CLIENT PROPS
  const { address } = useAccount()
  const chainId = useNetwork()?.chain?.id
  // COMPONENT STATES
  const [fromChain, setSrcChain] = useState<number>()
  const [toChain, setDestChain] = useState<number>()
  const [fromToken, setSrcToken] = useState<LifiToken>(null)
  const [toToken, setDestToken] = useState<LifiToken>(null)
  const [srcTokenAmount, setSrcTokenAmount] = useState('')
  // FETCH RESULTS
  const [lifiChains, setLifiChains] = useState<{ chains?: [] }>({})
  const [lifiSrcTokens, setLifiSrcTokens] = useState<LifiToken[]>([])
  const [lifiDestTokens, setLifiDestTokens] = useState<LifiToken[]>([])
  const [lifiConnections, setLifiConnections] = useState({})
  const [lifiQuote, setLifiQuote] = useState<LifiQuote>(null)
  const [lifiQuoteError, setLifiQuoteError] = useState({})
  const [lifiStatus, setLifiStatus] = useState<LifiStatus>(null)
  // PREP PAGE
  useLayoutEffect(() => {
    !lifiChains?.chains && getChains().then((res) => setLifiChains(res))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // PREP APPROVE
  const prepApprove = usePrepareContractWrite({
    abi: erc20ABI,
    address: lifiQuote?.action?.fromToken?.address,
    functionName: 'approve',
    args: [
      lifiQuote?.estimate?.approvalAddress,
      BigNumber.from(parseAmount('1000000', 18)),
    ]
  })
  // SEND APPROVE
  const sendApprove = useContractWrite({
    ...prepApprove.config,
    onSuccess: console.log,
  })
  // READ ALLOWANCE
  const readAllowance = useContractRead({
    abi: erc20ABI,
    address: lifiQuote?.action?.fromToken?.address,
    functionName: 'allowance',
    args: [
      address,
      lifiQuote?.estimate?.approvalAddress,
    ]
  })
  // PREP TX
  const prepTx = usePrepareSendTransaction({
    request: {
      from: address,
      to: lifiQuote?.transactionRequest?.to,
      value: BigNumber.from(lifiQuote?.transactionRequest?.value ?? '0'),
      data: lifiQuote?.transactionRequest?.data,
      gasPrice: BigNumber.from(lifiQuote?.transactionRequest?.gasPrice ?? '0'),
      gasLimit: BigNumber.from(lifiQuote?.transactionRequest?.gasLimit ?? '0'),
    },
  })
  // INIT TX
  const sendTx = useSendTransaction({
    ...prepTx.config,
    onSuccess: (res) =>
      getStatus({ bridge: lifiQuote?.tool, fromChain, toChain, txHash: res.hash }).then((res) =>
        setLifiStatus(res)
      ),
  })
  // HANDLE ON CHAIN SETTLE
  useEffect(() => {
    if (!!fromChain && !!toChain)
      getConnections({
        fromChain,
        toChain,
      }).then((res) => {
        setLifiConnections(res)
        if (!!res?.connections[0]) {
          setLifiSrcTokens(res.connections[0].fromTokens)
          setLifiDestTokens(res.connections[0].toTokens)
        }
      })
  }, [fromChain, toChain])
  // CHECK STATUS OF LIFI TX
  useEffect(() => {
    if (!!lifiStatus) {
      const interval = setTimeout(
        () =>
          getStatus({
            bridge: lifiQuote?.tool,
            fromChain,
            toChain,
            txHash: lifiStatus.sending.txHash,
          }).then((res) => setLifiStatus(res)),
        10000
      )
      if (lifiStatus?.status === 'DONE') clearTimeout(interval)
      return () => clearTimeout(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifiStatus?.status])
  // INFO
  const Info = () => (
    <Stack maxW={'60%'}>
      <Heading size={'md'}>States</Heading>
      <Heading size={'sm'}>Available Chains</Heading>
      <ReactJson src={lifiChains} />
      <Heading size={'sm'}>Available Connections</Heading>
      <ReactJson src={lifiConnections} />
      <Heading size={'sm'}>Available Tokens</Heading>
      <Wrap>
        <Stack>
          <Heading size={'xs'}>{`Src Chain Id ( ${fromChain} )`}</Heading>
          <ReactJson src={lifiSrcTokens} />
        </Stack>
        <Stack>
          <Heading size={'xs'}>{`Dest Chain Id ( ${toChain} )`}</Heading>
          <ReactJson src={lifiDestTokens} />
        </Stack>
      </Wrap>
      <Heading size={'sm'}>Selected Tokens</Heading>
      <Wrap>
        <Stack>
          <Heading size={'xs'}>Src</Heading>
          <ReactJson src={fromToken} />
        </Stack>
        <Stack>
          <Heading size={'xs'}>Dest</Heading>
          <ReactJson src={toToken} />
        </Stack>
      </Wrap>
      <Flex align={'center'} gap={5}>
        <Heading size={'sm'}>Li Fi Quote</Heading>
        <Button size={'xs'} onClick={() => setLifiQuote(null)}>
          Reset
        </Button>
      </Flex>
      <ReactJson src={lifiQuote} />
      <Flex align={'center'} gap={5}>
        <Heading size={'sm'}>Li Fi Quote Error</Heading>
        <Button size={'xs'} onClick={() => setLifiQuoteError(null)}>
          Reset
        </Button>
      </Flex>
      <ReactJson src={lifiQuoteError} />
    </Stack>
  )
  // SELECT SRC CHAIN
  const SelectSrcChain = () => (
    <>
      <Heading size={'xs'}>Choose Src Chain</Heading>
      <Select
        value={fromChain}
        w={'max-content'}
        placeholder="Select chain"
        onChange={(e) => setSrcChain(Number(e.target.value))}
      >
        {typeof lifiChains?.chains !== 'undefined' &&
          lifiChains.chains.map((item: any, index) => (
            <option key={index} value={item.id}>
              {item.name}
            </option>
          ))}
      </Select>
    </>
  )
  // SELECT DEST CHAIN
  const SelectDestChain = () => {
    return (
      <>
        <Heading size={'xs'}>Choose Dest Chain</Heading>
        <Select
          value={toChain}
          w={'max-content'}
          placeholder="Select chain"
          onChange={(e) => {
            setDestChain(Number(e.target.value))
          }}
        >
          {typeof lifiChains?.chains !== 'undefined' &&
            lifiChains.chains.map((item: any, index) => (
              <option key={index} value={item.id}>
                {item.name}
              </option>
            ))}
        </Select>
      </>
    )
  }
  // SELECT SRC TOKEN
  const SelectSrcToken = () => (
    <>
      <Heading size={'xs'}>Choose Src Token</Heading>
      <Select
        value={fromToken?.address}
        maxW={'150px'}
        placeholder="Select token"
        onChange={(e) => {
          const result = lifiSrcTokens.filter((f) => f.address === e.target.value)[0]
          setSrcToken(result)
        }}
      >
        {typeof lifiSrcTokens !== 'undefined' &&
          lifiSrcTokens.map((item: any, index) => (
            <option key={index} value={item.address}>
              {item.coinKey}
            </option>
          ))}
      </Select>
    </>
  )
  // SELECT DEST TOKEN
  const SelectDestToken = () => (
    <>
      <Heading size={'xs'}>Choose Dest Token</Heading>
      <Select
        value={toToken?.address}
        maxW={'150px'}
        placeholder="Select token"
        onChange={(e) => {
          const result = lifiDestTokens.filter((f) => f.address === e.target.value)[0]
          setDestToken(result)
        }}
      >
        {typeof lifiDestTokens !== 'undefined' &&
          lifiDestTokens.map((item: any, index) => (
            <option key={index} value={item.address}>
              {item.coinKey}
            </option>
          ))}
      </Select>
    </>
  )
  // INIT QUOTE
  const InitQuoteButton = () => (
    <>
      {!!fromChain && chainId !== fromChain && (
        <Alert status="warning" fontSize={'xs'}>
          <AlertIcon />
          Please Switch Your Chain To the Src Chain!
        </Alert>
      )}
      {!!fromToken && !!toToken && !!srcTokenAmount && <Button
        onClick={() =>
          getQuote({
            fromChain,
            toChain,
            fromToken: fromToken.address,
            toToken: toToken.address,
            fromAddress: address,
            fromAmount: parseAmount(srcTokenAmount, fromToken.decimals),
          })
            .then((res) => {
              setLifiQuote(res)
              readAllowance.refetch()
            })
            .catch((err) => setLifiQuoteError(err))
        }>
        Initiate
      </Button>}
    </>
  )
  // QUOTE PREVIEW AND SUBMIT
  const QuoteSubmit = () => {
    const e = lifiQuote?.estimate
    if (!!lifiQuote)
      return (
        <>
          <Divider />
          <Heading size={'md'}>Preview</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Gas</Th>
                  <Th>Fee</Th>
                  <Th isNumeric>Duration</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>
                    <ReactJson src={e.gasCosts} />
                  </Td>
                  <Td>
                    <ReactJson src={e.feeCosts} />
                  </Td>
                  <Td isNumeric>{e.executionDuration}</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
          <Button onClick={() => sendTx.sendTransaction()}>Confirm</Button>
        </>
      )
  }
  // TOKEN ALLOWANCE/APPROVE
  const TokenAllowance = () => {
    return (
      <>
        <Divider />
        <Heading size={'md'}>Allowance</Heading>
        <ReactJson src={readAllowance?.data as object ?? {}} />
      </>
    )
  }
  // TX STATUS
  const TxStatus = () => {
    if (!!lifiStatus)
      return (
        <>
          <Divider />
          <Heading size={'md'}>Status</Heading>
          <ReactJson src={lifiStatus} />
        </>
      )
  }
  // RETURN UI
  return (
    <Stack justify={'center'} align={'center'} overflow={'scroll'} pt={'5rem'} pb={'5rem'}>
      <ConnectKitButton />
      <HStack align={'top'} spacing={5} justify={'center'}>
        <Info />
        {/* SELECTORS */}
        <Stack maxW={'40%'}>
          <Heading size={'md'}>Selectors</Heading>
          <HStack>
            {/* SRC ================================ SRC */}
            <Stack>
              <SelectSrcChain />
              <SelectSrcToken />
            </Stack>
            {/* DEST ================================ DEST */}
            <Stack>
              <SelectDestChain />
              <SelectDestToken />
            </Stack>
          </HStack>
          {/* SRC ================================ SRC */}
          <InputSrcTokenAmount value={srcTokenAmount} action={setSrcTokenAmount} />
          <InitQuoteButton />
          <TokenAllowance />
          <QuoteSubmit />
          <TxStatus />
        </Stack>
      </HStack>
    </Stack>
  )
}

// INPUT SRC TOKEN AMOUNT
const InputSrcTokenAmount = ({ value, action }) => (
  <>
    <Heading size={'xs'}>Input Src Token Amount</Heading>
    <Input
      placeholder="Token Amount"
      variant="outline"
      value={value}
      onChange={(e) => action(e.target.value)}
    />
  </>
)

