import React from "react";
import { Card, Button, Table, Badge } from "react-bootstrap";

const MemberDetails = ({
  member,
  isManager,
  onRemoveMember,
  onUpdateStatus,
}) => {
  if (!member) return null;

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      onRemoveMember(member.nodeAddress);
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
      onUpdateStatus(member.nodeAddress, !member.isActive);
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
              <td className="text-break">{member.nodeAddress}</td>
            </tr>
            <tr>
              <th>Public Key:</th>
              <td className="text-break">{member.publicKey}</td>
            </tr>
            <tr>
              <th>Joined:</th>
              <td>{member.joinedAt}</td>
            </tr>
            <tr>
              <th>Last Updated:</th>
              <td>{member.lastUpdated}</td>
            </tr>

            <tr>
              <th>Serial Number:</th>
              <td>{member.serial || "Not set"}</td>
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
