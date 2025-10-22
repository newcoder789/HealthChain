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
#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    // Helper to reset state between tests
    fn reset_state() {
        STATE.with(|s| {
            *s.borrow_mut() = State::default();
        });
    }

    #[test]
    fn test_create_dataset_success() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "dataset-001".to_string(),
            name: "COVID-19 Study Data".to_string(),
            description: "Anonymized patient records for COVID-19 research".to_string(),
            record_count: Nat::from(1000u64),
            created_at: 1234567890,
            anonymized_data_reference: "ipfs://QmAnonymizedData123".to_string(),
        };

        let result = create_dataset(metadata.clone());
        assert!(result.is_ok());

        // Verify dataset was stored
        STATE.with(|s| {
            let state = s.borrow();
            assert!(state.datasets.contains_key(&"dataset-001".to_string()));
            let stored = state.datasets.get(&"dataset-001".to_string()).unwrap();
            assert_eq!(stored.name, "COVID-19 Study Data");
            assert_eq!(stored.record_count, Nat::from(1000u64));
        });
    }

    #[test]
    fn test_create_dataset_duplicate_id() {
        reset_state();
        
        let metadata1 = DatasetMetadata {
            id: "dataset-duplicate".to_string(),
            name: "First Dataset".to_string(),
            description: "First description".to_string(),
            record_count: Nat::from(100u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://first".to_string(),
        };

        let metadata2 = DatasetMetadata {
            id: "dataset-duplicate".to_string(),
            name: "Second Dataset".to_string(),
            description: "Second description".to_string(),
            record_count: Nat::from(200u64),
            created_at: 2000,
            anonymized_data_reference: "ipfs://second".to_string(),
        };

        let result1 = create_dataset(metadata1);
        assert!(result1.is_ok());

        let result2 = create_dataset(metadata2);
        assert!(result2.is_err());
        assert_eq!(result2.unwrap_err(), "Dataset with this ID already exists");
    }

    #[test]
    fn test_list_datasets_empty() {
        reset_state();
        
        let datasets = list_datasets();
        assert_eq!(datasets.len(), 0);
    }

    #[test]
    fn test_list_datasets_multiple() {
        reset_state();
        
        for i in 1..=5 {
            let metadata = DatasetMetadata {
                id: format!("dataset-{}", i),
                name: format!("Dataset {}", i),
                description: format!("Description {}", i),
                record_count: Nat::from(i * 100),
                created_at: i * 1000,
                anonymized_data_reference: format!("ipfs://data{}", i),
            };
            create_dataset(metadata).unwrap();
        }

        let datasets = list_datasets();
        assert_eq!(datasets.len(), 5);
        
        // Verify all datasets are present
        let ids: Vec<String> = datasets.iter().map(|d| d.id.clone()).collect();
        for i in 1..=5 {
            assert!(ids.contains(&format!("dataset-{}", i)));
        }
    }

    #[test]
    fn test_request_access_new_request() {
        reset_state();
        
        // First create a dataset
        let metadata = DatasetMetadata {
            id: "dataset-test".to_string(),
            name: "Test Dataset".to_string(),
            description: "For testing access requests".to_string(),
            record_count: Nat::from(500u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://test".to_string(),
        };
        create_dataset(metadata).unwrap();

        // Request access
        request_access("dataset-test".to_string(), "Cancer research study".to_string());

        // Verify request was created
        STATE.with(|s| {
            let state = s.borrow();
            assert_eq!(state.requests.len(), 1);
            
            let request = &state.requests[0];
            assert_eq!(request.dataset_id, "dataset-test");
            assert_eq!(request.purpose, "Cancer research study");
            assert_eq!(request.status, AccessStatus::Pending);
        });
    }

    #[test]
    fn test_request_access_multiple_researchers() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "popular-dataset".to_string(),
            name: "Popular Dataset".to_string(),
            description: "Highly requested data".to_string(),
            record_count: Nat::from(10000u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://popular".to_string(),
        };
        create_dataset(metadata).unwrap();

        // Multiple researchers request access
        request_access("popular-dataset".to_string(), "Study 1".to_string());
        request_access("popular-dataset".to_string(), "Study 2".to_string());
        request_access("popular-dataset".to_string(), "Study 3".to_string());

        STATE.with(|s| {
            let state = s.borrow();
            assert_eq!(state.requests.len(), 3);
            
            for request in &state.requests {
                assert_eq!(request.dataset_id, "popular-dataset");
                assert_eq!(request.status, AccessStatus::Pending);
            }
        });
    }

    #[test]
    fn test_approve_access_request_success() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "dataset-approve".to_string(),
            name: "Approval Test Dataset".to_string(),
            description: "Testing approval workflow".to_string(),
            record_count: Nat::from(200u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://approve".to_string(),
        };
        create_dataset(metadata).unwrap();

        request_access("dataset-approve".to_string(), "Valid research purpose".to_string());

        let result = approve_access_request(0);
        assert!(result.is_ok());

        // Verify status changed to Approved
        STATE.with(|s| {
            let state = s.borrow();
            assert_eq!(state.requests[0].status, AccessStatus::Approved);
            
            // Verify approved_access map was updated
            let researcher = state.requests[0].researcher;
            assert!(state.approved_access.contains_key(&researcher));
            let approved_datasets = state.approved_access.get(&researcher).unwrap();
            assert!(approved_datasets.contains(&"dataset-approve".to_string()));
        });
    }

    #[test]
    fn test_approve_access_request_invalid_index() {
        reset_state();
        
        let result = approve_access_request(0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid request index");

        request_access("dataset-1".to_string(), "purpose".to_string());
        
        let result = approve_access_request(5);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid request index");
    }

    #[test]
    fn test_approve_access_request_already_processed() {
        reset_state();
        
        request_access("dataset-1".to_string(), "purpose".to_string());
        
        // Approve once
        approve_access_request(0).unwrap();
        
        // Try to approve again
        let result = approve_access_request(0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Request is not pending");
    }

    #[test]
    fn test_multiple_datasets_same_researcher() {
        reset_state();
        
        // Create multiple datasets
        for i in 1..=3 {
            let metadata = DatasetMetadata {
                id: format!("dataset-{}", i),
                name: format!("Dataset {}", i),
                description: format!("Description {}", i),
                record_count: Nat::from(100u64),
                created_at: 1000,
                anonymized_data_reference: format!("ipfs://{}", i),
            };
            create_dataset(metadata).unwrap();
        }

        // Same researcher requests access to all
        for i in 1..=3 {
            request_access(format!("dataset-{}", i), format!("Purpose {}", i));
        }

        // Approve all requests
        for i in 0..3 {
            approve_access_request(i).unwrap();
        }

        // Verify researcher has access to all datasets
        STATE.with(|s| {
            let state = s.borrow();
            let researcher = state.requests[0].researcher;
            let approved = state.approved_access.get(&researcher).unwrap();
            assert_eq!(approved.len(), 3);
            for i in 1..=3 {
                assert!(approved.contains(&format!("dataset-{}", i)));
            }
        });
    }

    #[test]
    fn test_access_request_timestamps() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "time-test".to_string(),
            name: "Time Test Dataset".to_string(),
            description: "Testing timestamps".to_string(),
            record_count: Nat::from(100u64),
            created_at: 5000,
            anonymized_data_reference: "ipfs://time".to_string(),
        };
        create_dataset(metadata).unwrap();

        request_access("time-test".to_string(), "Time study".to_string());

        STATE.with(|s| {
            let state = s.borrow();
            let request = &state.requests[0];
            // Timestamp should be greater than 0 (set by ic_cdk::api::time())
            assert!(request.requested_at >= 0);
        });
    }

    #[test]
    fn test_dataset_with_large_record_count() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "large-dataset".to_string(),
            name: "Large Dataset".to_string(),
            description: "Dataset with many records".to_string(),
            record_count: Nat::from(1_000_000u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://large".to_string(),
        };

        let result = create_dataset(metadata);
        assert!(result.is_ok());

        let datasets = list_datasets();
        assert_eq!(datasets[0].record_count, Nat::from(1_000_000u64));
    }

    #[test]
    fn test_dataset_with_empty_description() {
        reset_state();
        
        let metadata = DatasetMetadata {
            id: "empty-desc".to_string(),
            name: "No Description Dataset".to_string(),
            description: "".to_string(),
            record_count: Nat::from(50u64),
            created_at: 1000,
            anonymized_data_reference: "ipfs://nodesc".to_string(),
        };

        let result = create_dataset(metadata);
        assert!(result.is_ok());
    }

    #[test]
    fn test_access_status_equality() {
        assert_eq!(AccessStatus::Pending, AccessStatus::Pending);
        assert_eq!(AccessStatus::Approved, AccessStatus::Approved);
        assert_eq!(AccessStatus::Rejected, AccessStatus::Rejected);
        assert_ne!(AccessStatus::Pending, AccessStatus::Approved);
        assert_ne!(AccessStatus::Approved, AccessStatus::Rejected);
    }
}