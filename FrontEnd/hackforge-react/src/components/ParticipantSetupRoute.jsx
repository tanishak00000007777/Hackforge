import { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import ParticipantWelcomePage from '../pages/ParticipantWelcomePage.jsx';

function storageKey(userId) {
  return `hackforge_participant_welcome_seen:${userId}`;
}

export default function ParticipantSetupRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const [dismissed, setDismissed] = useState(false);

  const alreadySeen = user?.id ? localStorage.getItem(storageKey(user.id)) === '1' : false;

  if (!alreadySeen && !dismissed) {
    return (
      <ParticipantWelcomePage
        onContinue={() => {
          if (user?.id) localStorage.setItem(storageKey(user.id), '1');
          setDismissed(true);
        }}
      />
    );
  }

  return children;
}
