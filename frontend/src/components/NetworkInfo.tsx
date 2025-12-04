import { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contractService from '../utils/contractHelpers';

interface NetworkData {
  rpcUrl: string | null;
  chainId: string;
  blockNumber: string;
  blockTimestamp: string;
  gasPrice: string;
  balance: string;
  contractDeployed: boolean;
  latency: number;
  memberCount: number;
}

interface NetworkInfoProps {
  onClose?: () => void;
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({ onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkData, setNetworkData] = useState<NetworkData>({
    rpcUrl: null,
    chainId: '-',
    blockNumber: '-',
    blockTimestamp: '-',
    gasPrice: '-',
    balance: '-',
    contractDeployed: false,
    latency: -1,
    memberCount: 0,
  });

  const fetchNetworkData = async () => {
    if (!contractService.isConnected) return;

    setLoading(true);
    try {
      const [chainId, block, gasPrice, balance, deployed, latency, members] = await Promise.all([
        contractService.getChainId().catch(e => { console.error('ChainId error:', e); return BigInt(0); }),
        contractService.getLatestBlock().catch(e => { console.error('Block error:', e); return { number: BigInt(0), timestamp: BigInt(0) }; }),
        contractService.getGasPrice().catch(e => { console.error('GasPrice error:', e); return BigInt(0); }),
        contractService.getBalance(contractService.account || '').catch(e => { console.error('Balance error:', e); return BigInt(0); }),
        contractService.isContractDeployed().catch(e => { console.error('Deployed error:', e); return false; }),
        contractService.measureLatency().catch(e => { console.error('Latency error:', e); return -1; }),
        contractService.getAllMembers().catch(e => { console.error('Members error:', e); return []; }),
      ]);

      const rpcUrl = contractService.getRpcUrl();
      const timestamp = Number(block.timestamp) > 0 ? new Date(Number(block.timestamp) * 1000) : new Date();

      setNetworkData({
        rpcUrl,
        chainId: chainId.toString(),
        blockNumber: block.number.toString(),
        blockTimestamp: timestamp.toLocaleString(),
        gasPrice: Number(gasPrice) > 0 ? (Number(gasPrice) / 1e9).toFixed(2) + ' Gwei' : 'N/A',
        balance: Number(balance) >= 0 ? (Number(balance) / 1e18).toFixed(4) + ' XDC' : 'N/A',
        contractDeployed: deployed,
        latency,
        memberCount: members.length,
      });
    } catch (error) {
      console.error('Error fetching network data:', error);
      toast.error('Failed to fetch network data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractService.isConnected && isExpanded) {
      fetchNetworkData();
      const interval = setInterval(fetchNetworkData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isExpanded]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatAddress = (address: string | null) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!contractService.isConnected) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '400px',
      }}
    >
      <Card className="shadow">
        <Card.Header
          className="d-flex justify-content-between align-items-center bg-dark text-white"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>
            <i className={`bi bi-${isExpanded ? 'chevron-down' : 'chevron-right'} me-2`}></i>
            Debug Info
          </span>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={networkData.contractDeployed ? 'success' : 'warning'}>
              {networkData.contractDeployed ? 'Contract OK' : 'No Contract'}
            </Badge>
            {onClose && (
              <Button
                variant="link"
                size="sm"
                className="text-white p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{ fontSize: '1.2rem', lineHeight: 1 }}
                title="Close debug panel"
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            )}
          </div>
        </Card.Header>

        {isExpanded && (
          <Card.Body style={{ maxHeight: '70vh', overflowY: 'auto', fontSize: '0.85rem' }}>
            {loading && (
              <div className="text-center mb-3">
                <Spinner animation="border" size="sm" />
              </div>
            )}

            {/* Network Section */}
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <i className="bi bi-globe me-2"></i>Network
              </h6>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">RPC URL:</span>
                  <span className="text-end">
                    {networkData.rpcUrl ? (
                      <>
                        {formatAddress(networkData.rpcUrl)}
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 ms-1"
                          onClick={() => copyToClipboard(networkData.rpcUrl || '', 'RPC URL')}
                        >
                          <i className="bi bi-clipboard"></i>
                        </Button>
                      </>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Chain ID:</span>
                  <Badge bg="info">{networkData.chainId}</Badge>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Block Number:</span>
                  <span className="font-monospace">{networkData.blockNumber}</span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Block Time:</span>
                  <span className="small">{networkData.blockTimestamp}</span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Gas Price:</span>
                  <span>{networkData.gasPrice}</span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">RPC Latency:</span>
                  <Badge bg={networkData.latency < 100 ? 'success' : networkData.latency < 500 ? 'warning' : 'danger'}>
                    {networkData.latency >= 0 ? `${networkData.latency}ms` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>

            <hr />

            {/* Contract Section */}
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <i className="bi bi-file-earmark-code me-2"></i>Contract
              </h6>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Address:</span>
                  <span>
                    {formatAddress(contractService.contractAddress)}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-1"
                      onClick={() =>
                        copyToClipboard(contractService.contractAddress || '', 'Contract Address')
                      }
                    >
                      <i className="bi bi-clipboard"></i>
                    </Button>
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Deployment:</span>
                  <Badge bg={networkData.contractDeployed ? 'success' : 'danger'}>
                    {networkData.contractDeployed ? 'Deployed' : 'Not Found'}
                  </Badge>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Member Count:</span>
                  <Badge bg="primary">{networkData.memberCount}</Badge>
                </div>
              </div>
            </div>

            <hr />

            {/* Wallet Section */}
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <i className="bi bi-wallet2 me-2"></i>Wallet
              </h6>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Account:</span>
                  <span>
                    {formatAddress(contractService.account)}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-1"
                      onClick={() => copyToClipboard(contractService.account || '', 'Account Address')}
                    >
                      <i className="bi bi-clipboard"></i>
                    </Button>
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Balance:</span>
                  <span className="font-monospace">{networkData.balance}</span>
                </div>
              </div>
            </div>

            <div className="d-grid">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={fetchNetworkData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh Data
              </Button>
            </div>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default NetworkInfo;
