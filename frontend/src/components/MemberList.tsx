import React, { useState, useEffect } from 'react';
import { ListGroup, Card, Form, Spinner } from 'react-bootstrap';
import contractService from '../utils/contractHelpers';

interface MemberListProps {
  members: string[];
  onSelectMember: (address: string) => Promise<void>;
  loading: boolean;
}

const MemberList: React.FC<MemberListProps> = ({ members, onSelectMember, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<string[]>([]);
  const [memberStatus, setMemberStatus] = useState<Record<string, boolean>>({});

  // Filter members based on search term
  useEffect(() => {
    if (!members) return;

    const filtered = members.filter(address => 
      address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [members, searchTerm]);

  // Fetch status for each member
  useEffect(() => {
    const fetchMemberStatus = async () => {
      if (!members || members.length === 0) return;
      
      const statusObj: Record<string, boolean> = {};
      for (const address of members) {
        try {
          // First check if member exists to avoid unnecessary RPC errors
          const exists = await contractService.isMember(address);
          if (!exists) {
            console.warn(`Member ${address} not found in contract`);
            statusObj[address] = false;
            continue;
          }
          
          const member = await contractService.getMember(address);
          statusObj[address] = member.isActive;
        } catch (error) {
          console.error(`Error fetching status for ${address}:`, error);
          statusObj[address] = false;
        }
      }
      setMemberStatus(statusObj);
    };

    fetchMemberStatus();
  }, [members]);

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Network Members</Card.Header>
      <Card.Body>
        <Form.Control
          type="text"
          placeholder="Search members by address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />
        
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center p-4">
            <p>No members found in the network</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {filteredMembers.map(address => (
              <ListGroup.Item
                key={address}
                action
                onClick={() => onSelectMember(address)}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="text-truncate" style={{ maxWidth: '80%' }}>
                  {address}
                </div>
                {memberStatus[address] !== undefined && (
                  <span className={`badge ${memberStatus[address] ? 'bg-success' : 'bg-danger'}`}>
                    {memberStatus[address] ? 'Active' : 'Inactive'}
                  </span>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        
        <div className="mt-3">
          <small className="text-muted">Total Members: {members.length}</small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MemberList;
