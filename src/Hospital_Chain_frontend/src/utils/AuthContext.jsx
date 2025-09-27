import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { canisterId, Hospital_Chain_backend } from 'declarations/Hospital_Chain_backend';
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
    userRole: null
  });

  // New function to check for auth and set role correctly
  const checkAuthAndSetRole = useCallback(async () => {
    const authClient = await AuthClient.create();
    const isAuthenticated = await authClient.isAuthenticated();
    let actor = state.actor;
    let principal = state.principal;
    let currentRole = null;

    if (isAuthenticated) {
      const identity = authClient.getIdentity();
      principal = identity.getPrincipal().toString();
      actor = createActor(canisterId, { agentOptions: { identity } });
      console.log("actor setted as", actor);
      try {
        const userProfile = await actor.get_profile();
        // Fix: userProfile.role is now an array of roles
        if (userProfile.role.includes('Patient')) currentRole = 'Patient';
        else if (userProfile.role.includes('Doctor')) currentRole = 'Doctor';
        else if (userProfile.role.includes('Researcher')) currentRole = 'Researcher';
        else currentRole = null;
      } catch (error) {
        currentRole = null; 
        try {
          // Automatically register as a patient.
          // await actor.register_user({ Patient: null });
          await actor.get_or_create_user_profile();
          currentRole = ['Patient', 'Doctor', 'Researcher'];
        } catch (registerError) {
          console.error("Failed to register user:", registerError);
        currentRole = null;
        }
      }
    }

    setState({
      actor,
      authClient,
      isAuthenticated,
      principal,
      userRole: currentRole,
    });
  }, [state.actor, state.principal]);

  useEffect(() => {
    checkAuthAndSetRole();
  }, [checkAuthAndSetRole]);

  const login = async () => {
    if (state.authClient) {
      await state.authClient.login({
        identityProvider,
        onSuccess: checkAuthAndSetRole,
      });
    }
  };

  const logout = async () => {
    if (state.authClient) {
      await state.authClient.logout();
      checkAuthAndSetRole();
    }
  };

  // New register function
  const registerUser = async (role) => {
    if (state.actor) {
              await state.actor.register_user({ [role]: null });
        checkAuthAndSetRole();
        }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, registerUser }}>
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