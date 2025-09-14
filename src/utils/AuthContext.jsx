import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { canisterId } from 'declarations/Hospital_Chain_backend/index.js';
import { createActor } from 'declarations/Hospital_Chain_backend';

const network = process.env.DFX_NETWORK;
const identityProvider =
  network === 'ic'
    ? 'https://identity.ic0.app'
    : 'http://uzt4z-lp777-77774-qaabq-cai.localhost:4943';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    actor: undefined,
    authClient: undefined,
    isAuthenticated: false,
    principal: 'Click "Whoami" to see your principal ID',
  });

  const updateActor = useCallback(async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const actor = createActor(canisterId, {
      agentOptions: { identity },
    });
    const isAuthenticated = await authClient.isAuthenticated();
    setState((prev) => ({
      ...prev,
      actor,
      authClient,
      isAuthenticated,
      principal: identity.getPrincipal().toString(),
    }));
  }, []);

  useEffect(() => {
    updateActor();
  }, [updateActor]);

  const login = async () => {
    if (state.authClient) {
      await state.authClient.login({
        identityProvider,
        onSuccess: updateActor,
      });
    }
  };

  const logout = async () => {
    if (state.authClient) {
      await state.authClient.logout();
      updateActor();
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
