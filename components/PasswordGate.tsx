'use client';

import { useEffect, useRef, useState } from 'react';

const PASSWORD = '77168';

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStorage.getItem('travel-auth') === 'true') {
      setAuthorized(true);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  function login() {
    if (password === PASSWORD) {
      localStorage.setItem('travel-auth', 'true');
      setAuthorized(true);
      return;
    }

    setError(true);
    setPassword('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
  <main className="loginPage">
    <div className="loginOverlay" />

    <div className="loginCard">

      <div className="loginBrand">
        <div className="loginLeaf">
          🍁
        </div>

        <h1 className="loginTitle">
          CANADA
          <br />
          2026
        </h1>

        <p className="loginEyebrow">
          FAMILY TRAVEL GUIDE
        </p>

        <p className="loginSubtitle">
          August 13 — August 28
        </p>
      </div>

      <input
        ref={inputRef}
        className="loginInput"
        type="password"
        placeholder="Travel Access Code"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            login();
          }
        }}
      />

      <button
        className="loginButton"
        onClick={login}
      >
        Start Journey →
      </button>

      {error && (
        <p className="loginError">
          Access code incorrect.
        </p>
      )}

    </div>
  </main>
);
