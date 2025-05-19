import React from 'react';

type Props = {
  callTo: string;
  setCallTo: (value: string) => void;
  callUser: (id: string) => void;
};

const UserControls: React.FC<Props> = ({ callTo, setCallTo, callUser }) => {
  return (
    <div>
      <input
        type="text"
        placeholder="Enter user ID to call"
        value={callTo}
        onChange={(e) => setCallTo(e.target.value)}
      />
      <button onClick={() => callUser(callTo)}>Call</button>
    </div>
  );
};

export default UserControls;