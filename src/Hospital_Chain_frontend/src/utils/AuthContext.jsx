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
  const [userRole, setUserRole] = useState(null);

  const updateActor = useCallback(async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const actor = createActor(canisterId, {
      agentOptions: { identity },
    });
    const isAuthenticated = await authClient.isAuthenticated();
    try {
      const userProfile = await canisterActor.get_profile();
      if (userProfile.role.Patient) setUserRole('Patient');
      else if (userProfile.role.Doctor) setUserRole('Doctor');
      else if (userProfile.role.Researcher) setUserRole('Researcher');
    } catch (error) {
      setUserRole("None");
    }
    setState((prev) => ({
      ...prev,
      actor,
      authClient,
      isAuthenticated,
      principal: identity.getPrincipal().toString(),
      userRole
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



// const handleAuthenticated = async (client) => {
//     const identity = client.getIdentity();
//     const principal = identity.getPrincipal();
//     const canisterActor = createActor(canisterId, { agentOptions: { identity } });

//     setIsAuthenticated(true);
//     setUserPrincipal(principal);
//     setActor(canisterActor);

//     try {
//         const userProfile = await canisterActor.get_profile();
//         if (userProfile.role.Patient) setUserRole('Patient');
//         else if (userProfile.role.Doctor) setUserRole('Doctor');
//         else if (userProfile.role.Researcher) setUserRole('Researcher');
//         setPage('dashboard');
//     } catch (error) {
//         // User is authenticated but not registered
//         setPage('role-selection');
//     }
// };