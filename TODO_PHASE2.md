# Phase 2: Researcher Workflow & Basic Access - Implementation Steps

## Overview
Phase 2 focuses on enabling researchers to find, request access to, and manage research datasets. This includes building the researcher dashboard, dataset browsing, access request system, and basic project management.

## 12 Implementation Steps

### Step 1: Update dfx.json for new canisters ✅
- Ensure dataset_manager, research_marketplace, and icrc1_ledger are properly configured in dfx.json
- Add init args for research_marketplace to pass ledger canister ID
- Verify canister dependencies and build configurations

### Step 2: Implement dataset_manager canister ✅
- Create the dataset_manager canister with DatasetMetadata and AccessRequest structs
- Implement create_dataset function for admins to add anonymized datasets
- Implement list_datasets query function
- Implement request_access function for researchers
- Implement approve_access_request function for admins

### Step 3: Update research_marketplace canister ✅
- Modify init function to accept ledger_canister_id as parameter
- Fix create_bounty function to properly increment next_bounty_id
- Ensure proper integration with HCT token ledger for bounty funding
- Add error handling for ledger operations

### Step 4: Implement icrc1_ledger canister ✅
- Set up the HCT token canister using ICRC-1 standard
- Configure initial token supply and distribution
- Implement token transfer, balance checking, and approval functions
- Ensure compatibility with wallet integrations

### Step 5: Build Researcher Dashboard UI ✅
- Create the main researcher dashboard layout
- Add navigation and key statistics display (available datasets, active projects)
- Implement role-based access control for researcher features
- Connect to backend canister for real-time data

### Step 6: Build Dataset Browser UI ✅
- Create dataset browsing interface with metadata display
- Implement filtering and search functionality
- Show privacy protection details and access requirements
- Add dataset preview capabilities (without exposing raw data)

### Step 7: Implement Dataset Access Request Form (Frontend) ✅
- Build comprehensive request form with purpose, duration, ethical approval fields
- Add file upload for supporting documents
- Implement form validation and user guidance
- Connect form submission to backend canister

### Step 8: Implement Dataset Access Request Logic (Backend) ✅
- Enhance dataset_manager canister with request processing
- Add request status tracking (pending, approved, rejected)
- Implement admin approval workflow
- Add audit logging for all access requests

### Step 9: Build Project Creation & Management UI ✅
- Create project creation form with scope, timeline, budget fields
- Build project dashboard for managing active projects
- Implement project status tracking and progress updates
- Add project data linking to approved datasets

### Step 10: Implement Project Management Canister ❌ (Skipped - integrated into UI mock)
- Create project storage and management functions
- Implement project ownership and access control
- Add project-dataset association logic
- Ensure integration with researcher verification system

### Step 11: Add Collaboration Feature (Backend) ❌ (Future phase)
- Implement project invitation system in canister
- Add collaborator role management
- Ensure secure access control for shared projects
- Add collaboration audit logging

### Step 12: Add Collaboration Invitation UI (Frontend) ❌ (Future phase)
- Build invitation sending interface
- Create invitation management (accept/reject)
- Implement collaborator management in project UI
- Add real-time notifications for collaboration requests

## Dependencies
- Phase 1 completion (canister build fixes)
- Main registry canister for user verification
- Frontend authentication system
- Basic UI framework setup

## Testing Requirements
- Unit tests for all canister functions
- Integration tests for frontend-backend communication
- End-to-end testing of access request workflow
- Security testing for data access controls

## Success Criteria
- Researchers can browse available datasets
- Complete access request and approval workflow
- Project creation and basic management
- Secure collaboration features
- Integration with HCT token system
