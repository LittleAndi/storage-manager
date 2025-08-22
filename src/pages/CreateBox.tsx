import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import CreateBoxModal from "../components/CreateBoxModal";

const CreateBox: React.FC = () => {
  const navigate = useNavigate();
  const { spaceId } = useParams();
  // Modal is always open on this route
  const handleClose = () => {
    navigate(`/spaces/${spaceId}`);
  };
  return (
    <AppShell>
      <CreateBoxModal open={true} onClose={handleClose} />
    </AppShell>
  );
};

export default CreateBox;
