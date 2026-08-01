'use client';

import { useEffect, useState } from 'react';

const PASSWORD = 'Canada2026';

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (localStorage.getItem('travel-auth') === 'true') {
      setAuthorized(true);
    }
  }, []);

  function login() {
    if (password === PASSWORD) {
      localStorage.setItem('travel-auth', 'true');
      setAuthorized(true);
      return;
    }

    alert('密碼錯誤');
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <main>
      <h1>Canada 2026</h1>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') login();
        }}
      />

      <button onClick={login}>
        Continue
      </button>
    </main>
  );
}
