import React from "react";
import { Card, Button, Table, Badge } from "react-bootstrap";
import type { Member } from '../types/contract';

interface MemberDetailsProps {
  member: Member;
  isManager: boolean;
  onRemoveMember: (address: string) => Promise<void>;
  onUpdateStatus: (address: string, isActive: boolean) => Promise<void>;
}

const MemberDetails: React.FC<MemberDetailsProps> = ({
  member,
  isManager,
  onRemoveMember,
  onUpdateStatus,
}) => {
  if (!member) return null;

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      onRemoveMember(member.memberAddress);
    }
  };

  const handleStatusChange = () => {
    if (
      window.confirm(
        `Are you sure you want to set this member to ${
          member.isActive ? "inactive" : "active"
        }?`
      )
    ) {
      onUpdateStatus(member.memberAddress, !member.isActive);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">
        Member Details
        <Badge bg={member.isActive ? "success" : "danger"} className="ms-2">
          {member.isActive ? "Active" : "Inactive"}
        </Badge>
      </Card.Header>
      <Card.Body>
        <Table responsive>
          <tbody>
            <tr>
              <th>X.500 Name:</th>
              <td>{member.x500Name}</td>
            </tr>
            <tr>
              <th>Address:</th>
              <td className="text-break">{member.memberAddress}</td>
            </tr>
            <tr>
              <th>Certificate Serial (Hex):</th>
              <td className="text-break font-monospace">{member.certSerialHex || "Not set"}</td>
            </tr>
            <tr>
              <th>Platform Version:</th>
              <td>{member.platformVersion || "Not set"}</td>
            </tr>
            <tr>
              <th>Host:</th>
              <td>{member.host || "Not set"}</td>
            </tr>
            <tr>
              <th>Port:</th>
              <td>{member.port || "Not set"}</td>
            </tr>
          </tbody>
        </Table>

        {isManager && (
          <div className="d-flex gap-2">
            <Button
              variant={member.isActive ? "warning" : "success"}
              onClick={handleStatusChange}
            >
              Set {member.isActive ? "Inactive" : "Active"}
            </Button>
            <Button variant="danger" onClick={handleRemove}>
              Remove Member
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MemberDetails;
