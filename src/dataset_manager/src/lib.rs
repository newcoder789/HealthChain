use candid::{CandidType, Principal, Nat};
use ic_cdk_macros::*;
use std::collections::HashMap;

type DatasetId = String;
type ResearcherPrincipal = Principal;

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize, PartialEq)]
enum AccessStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
struct DatasetMetadata {
    id: DatasetId,
    name: String,
    description: String,
    record_count: Nat,
    created_at: u64,
    // This would be a reference to the anonymized data pool, perhaps managed by the ml_service
    anonymized_data_reference: String,
}

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize)]
struct AccessRequest {
    researcher: ResearcherPrincipal,
    dataset_id: DatasetId,
    purpose: String,
    status: AccessStatus,
    requested_at: u64,
}

#[derive(Default)]
struct State {
    datasets: HashMap<DatasetId, DatasetMetadata>,
    requests: Vec<AccessRequest>,
    // Maps a researcher to the set of DatasetIds they are approved for
    approved_access: HashMap<ResearcherPrincipal, Vec<DatasetId>>,
}

thread_local! {
    static STATE: std::cell::RefCell<State> = std::cell::RefCell::new(State::default());
}

/// Admin function to create a new research dataset after anonymization
#[update]
fn create_dataset(metadata: DatasetMetadata) -> Result<(), String> {
    // TODO: Add admin guard
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        if state.datasets.contains_key(&metadata.id) {
            return Err("Dataset with this ID already exists".to_string());
        }
        state.datasets.insert(metadata.id.clone(), metadata);
        Ok(())
    })
}

#[query]
fn list_datasets() -> Vec<DatasetMetadata> {
    STATE.with(|s| s.borrow().datasets.values().cloned().collect())
}

#[update]
fn request_access(dataset_id: DatasetId, purpose: String) {
    // TODO: Check if caller is a verified researcher by calling the main_registry canister
    let request = AccessRequest {
        researcher: ic_cdk::caller(),
        dataset_id,
        purpose,
        status: AccessStatus::Pending,
        requested_at: ic_cdk::api::time(),
    };
    STATE.with(|s| s.borrow_mut().requests.push(request));
}

/// Admin function to approve a researcher's access request
#[update]
fn approve_access_request(request_index: usize) -> Result<(), String> {
    // TODO: Add admin/DAO guard - for now, allow any caller (to be secured later)
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        if request_index >= state.requests.len() {
            return Err("Invalid request index".to_string());
        }
        let (researcher, dataset_id) = {
            let request = &mut state.requests[request_index];
            if request.status != AccessStatus::Pending {
                return Err("Request is not pending".to_string());
            }
            request.status = AccessStatus::Approved;
            (request.researcher, request.dataset_id.clone())
        };
        // Update approved access map
        state.approved_access.entry(researcher).or_insert_with(Vec::new).push(dataset_id);
        Ok(())
    })
}

ic_cdk::export_candid!();