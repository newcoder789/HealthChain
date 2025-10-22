use candid::{CandidType, Principal, Nat};
use ic_cdk_macros::*;
use std::collections::HashMap;
use candid::decode_args;
use ic_cdk;


type BountyId = Nat;
type ProjectId = Nat;

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
enum BountyStatus {
    Open,
    InProgress,
    Completed,
    Cancelled,
}

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
struct Bounty {
    id: BountyId,
    creator: Principal,
    title: String,
    description: String,
    reward: Nat, // Amount of HCT tokens
    status: BountyStatus,
    created_at: u64,
    winner: Option<Principal>,
}

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
enum ProjectStatus {
    Planning,
    Active,
    Completed,
    Cancelled,
}

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
struct Project {
    id: ProjectId,
    creator: Principal,
    name: String,
    description: String,
    category: String,
    status: ProjectStatus,
    progress: u32, // 0-100
    collaborators: Vec<String>, // email addresses
    datasets: u32,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: Nat,
    created_at: u64,
}

#[derive(Default)]
struct State {
    bounties: HashMap<BountyId, Bounty>,
    projects: HashMap<ProjectId, Project>,
    next_bounty_id: BountyId,
    next_project_id: ProjectId,
    ledger_canister_id: Option<Principal>,
}

thread_local! {
    static STATE: std::cell::RefCell<State> = std::cell::RefCell::new(State::default());
}

#[update]
async fn create_project(
    name: String,
    description: String,
    category: String,
    collaborators: Vec<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: Nat,
) -> Result<ProjectId, String> {
    let caller = ic_cdk::caller();

    let project_id = STATE.with(|s| {
        let mut state = s.borrow_mut();
        let id = state.next_project_id.clone();
        state.next_project_id += 1u64;
        id
    });

    let new_project = Project {
        id: project_id.clone(),
        creator: caller,
        name,
        description,
        category,
        status: ProjectStatus::Planning,
        progress: 0,
        collaborators,
        datasets: 0,
        start_date,
        end_date,
        budget,
        created_at: ic_cdk::api::time(),
    };

    STATE.with(|s| s.borrow_mut().projects.insert(project_id.clone(), new_project));

    Ok(project_id)
}

#[query]
fn get_user_projects(user: Principal) -> Vec<Project> {
    STATE.with(|s| {
        let state = s.borrow();
        state.projects.values()
            .filter(|p| p.creator == user)
            .cloned()
            .collect()
    })
}


// ...existing code...
#[init]
fn init(ledger_id: Principal) {
    STATE.with(|s| s.borrow_mut().ledger_canister_id = Some(ledger_id));
}
#[update]
async fn create_bounty(title: String, description: String, reward: Nat) -> Result<BountyId, String> {
    let caller = ic_cdk::caller();
    let ledger_id = STATE.with(|s| s.borrow().ledger_canister_id).unwrap();

    // 1. Call the ICRC1 ledger canister to transfer `reward` tokens from `caller` to this canister.
    // This effectively locks the funds in escrow.
    // Example: let transfer_result = ic_cdk::call(ledger_id, "icrc1_transfer", ...).await;
    // if transfer_result.is_err() { return Err("Token transfer failed".to_string()); }

    // 2. If transfer is successful, create the bounty.
    let bounty_id = STATE.with(|s| {
        let mut state = s.borrow_mut();
        let id = state.next_bounty_id.clone();
        state.next_bounty_id += 1u64;
        id
    });

    let new_bounty = Bounty {
        id: bounty_id.clone(),
        creator: caller,
        title,
        description,
        reward,
        status: BountyStatus::Open,
        created_at: ic_cdk::api::time(),
        winner: None,
    };

    STATE.with(|s| s.borrow_mut().bounties.insert(bounty_id.clone(), new_bounty));

    Ok(bounty_id)
}

// Other functions to implement: list_bounties, submit_to_bounty, award_bounty, etc.

ic_cdk::export_candid!();