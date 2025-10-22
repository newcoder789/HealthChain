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
#[cfg(test)]
mod tests {
    use super::*;

    fn reset_state() {
        STATE.with(|s| {
            *s.borrow_mut() = State::default();
        });
    }

    fn setup_with_ledger() {
        let ledger_principal = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap();
        init(ledger_principal);
    }

    #[test]
    fn test_init_sets_ledger_canister_id() {
        reset_state();
        let ledger_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap();
        
        init(ledger_id.clone());

        STATE.with(|s| {
            let state = s.borrow();
            assert_eq!(state.ledger_canister_id, Some(ledger_id));
        });
    }

    #[test]
    fn test_bounty_status_variants() {
        let open = BountyStatus::Open;
        let in_progress = BountyStatus::InProgress;
        let completed = BountyStatus::Completed;
        let cancelled = BountyStatus::Cancelled;

        // Verify all variants can be cloned
        let _ = open.clone();
        let _ = in_progress.clone();
        let _ = completed.clone();
        let _ = cancelled.clone();
    }

    #[test]
    fn test_project_status_variants() {
        let planning = ProjectStatus::Planning;
        let active = ProjectStatus::Active;
        let completed = ProjectStatus::Completed;
        let cancelled = ProjectStatus::Cancelled;

        // Verify all variants can be cloned
        let _ = planning.clone();
        let _ = active.clone();
        let _ = completed.clone();
        let _ = cancelled.clone();
    }

    #[test]
    fn test_bounty_struct_creation() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let bounty = Bounty {
            id: Nat::from(1u64),
            creator,
            title: "Research Task".to_string(),
            description: "Complete research analysis".to_string(),
            reward: Nat::from(1000u64),
            status: BountyStatus::Open,
            created_at: 1234567890,
            winner: None,
        };

        assert_eq!(bounty.title, "Research Task");
        assert_eq!(bounty.reward, Nat::from(1000u64));
        assert_eq!(bounty.winner, None);

        // Test clone
        let cloned = bounty.clone();
        assert_eq!(cloned.title, bounty.title);
    }

    #[test]
    fn test_bounty_with_winner() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        let winner = Principal::from_text("bbbbb-bb").unwrap();
        
        let bounty = Bounty {
            id: Nat::from(1u64),
            creator,
            title: "Completed Task".to_string(),
            description: "Task description".to_string(),
            reward: Nat::from(500u64),
            status: BountyStatus::Completed,
            created_at: 1000,
            winner: Some(winner),
        };

        assert!(bounty.winner.is_some());
        assert_eq!(bounty.winner.unwrap(), winner);
    }

    #[test]
    fn test_project_struct_creation() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let project = Project {
            id: Nat::from(1u64),
            creator,
            name: "Cancer Research Project".to_string(),
            description: "Analyzing cancer treatment data".to_string(),
            category: "Oncology".to_string(),
            status: ProjectStatus::Planning,
            progress: 0,
            collaborators: vec!["alice@example.com".to_string(), "bob@example.com".to_string()],
            datasets: 0,
            start_date: Some("2024-01-01".to_string()),
            end_date: Some("2024-12-31".to_string()),
            budget: Nat::from(50000u64),
            created_at: 1000,
        };

        assert_eq!(project.name, "Cancer Research Project");
        assert_eq!(project.category, "Oncology");
        assert_eq!(project.progress, 0);
        assert_eq!(project.collaborators.len(), 2);
        assert_eq!(project.budget, Nat::from(50000u64));
    }

    #[test]
    fn test_project_with_active_status() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let project = Project {
            id: Nat::from(2u64),
            creator,
            name: "Active Study".to_string(),
            description: "Ongoing research".to_string(),
            category: "Cardiology".to_string(),
            status: ProjectStatus::Active,
            progress: 45,
            collaborators: vec![],
            datasets: 5,
            start_date: Some("2024-01-01".to_string()),
            end_date: None,
            budget: Nat::from(10000u64),
            created_at: 1000,
        };

        assert_eq!(project.progress, 45);
        assert_eq!(project.datasets, 5);
        assert!(project.end_date.is_none());
    }

    #[test]
    fn test_project_progress_boundaries() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        // Test 0% progress
        let project_start = Project {
            id: Nat::from(1u64),
            creator: creator.clone(),
            name: "Starting".to_string(),
            description: "desc".to_string(),
            category: "cat".to_string(),
            status: ProjectStatus::Planning,
            progress: 0,
            collaborators: vec![],
            datasets: 0,
            start_date: None,
            end_date: None,
            budget: Nat::from(1000u64),
            created_at: 1000,
        };
        assert_eq!(project_start.progress, 0);

        // Test 100% progress
        let project_done = Project {
            id: Nat::from(2u64),
            creator,
            name: "Completed".to_string(),
            description: "desc".to_string(),
            category: "cat".to_string(),
            status: ProjectStatus::Completed,
            progress: 100,
            collaborators: vec![],
            datasets: 10,
            start_date: None,
            end_date: None,
            budget: Nat::from(1000u64),
            created_at: 2000,
        };
        assert_eq!(project_done.progress, 100);
    }

    #[test]
    fn test_get_user_projects_empty() {
        reset_state();
        setup_with_ledger();

        let user = Principal::from_text("aaaaa-aa").unwrap();
        let projects = get_user_projects(user);
        
        assert_eq!(projects.len(), 0);
    }

    #[test]
    fn test_get_user_projects_filters_by_creator() {
        reset_state();
        setup_with_ledger();

        let alice = Principal::from_text("aaaaa-aa").unwrap();
        let bob = Principal::from_text("bbbbb-bb").unwrap();

        // Add projects for different users
        STATE.with(|s| {
            let mut state = s.borrow_mut();
            
            // Alice's projects
            let project1 = Project {
                id: Nat::from(1u64),
                creator: alice,
                name: "Alice Project 1".to_string(),
                description: "desc1".to_string(),
                category: "cat1".to_string(),
                status: ProjectStatus::Active,
                progress: 30,
                collaborators: vec![],
                datasets: 2,
                start_date: None,
                end_date: None,
                budget: Nat::from(1000u64),
                created_at: 1000,
            };
            
            let project2 = Project {
                id: Nat::from(2u64),
                creator: alice,
                name: "Alice Project 2".to_string(),
                description: "desc2".to_string(),
                category: "cat2".to_string(),
                status: ProjectStatus::Planning,
                progress: 0,
                collaborators: vec![],
                datasets: 0,
                start_date: None,
                end_date: None,
                budget: Nat::from(2000u64),
                created_at: 2000,
            };
            
            // Bob's project
            let project3 = Project {
                id: Nat::from(3u64),
                creator: bob,
                name: "Bob Project".to_string(),
                description: "desc3".to_string(),
                category: "cat3".to_string(),
                status: ProjectStatus::Active,
                progress: 50,
                collaborators: vec![],
                datasets: 3,
                start_date: None,
                end_date: None,
                budget: Nat::from(3000u64),
                created_at: 3000,
            };

            state.projects.insert(Nat::from(1u64), project1);
            state.projects.insert(Nat::from(2u64), project2);
            state.projects.insert(Nat::from(3u64), project3);
        });

        // Query Alice's projects
        let alice_projects = get_user_projects(alice);
        assert_eq!(alice_projects.len(), 2);
        for project in &alice_projects {
            assert_eq!(project.creator, alice);
        }

        // Query Bob's projects
        let bob_projects = get_user_projects(bob);
        assert_eq!(bob_projects.len(), 1);
        assert_eq!(bob_projects[0].creator, bob);
        assert_eq!(bob_projects[0].name, "Bob Project");
    }

    #[test]
    fn test_state_next_ids_increment() {
        reset_state();

        STATE.with(|s| {
            let mut state = s.borrow_mut();
            
            assert_eq!(state.next_bounty_id, Nat::from(0u64));
            assert_eq!(state.next_project_id, Nat::from(0u64));

            // Simulate ID generation
            let bounty_id1 = state.next_bounty_id.clone();
            state.next_bounty_id += 1u64;
            let bounty_id2 = state.next_bounty_id.clone();
            state.next_bounty_id += 1u64;

            assert_eq!(bounty_id1, Nat::from(0u64));
            assert_eq!(bounty_id2, Nat::from(1u64));
            assert_eq!(state.next_bounty_id, Nat::from(2u64));

            // Same for projects
            let project_id1 = state.next_project_id.clone();
            state.next_project_id += 1u64;
            let project_id2 = state.next_project_id.clone();

            assert_eq!(project_id1, Nat::from(0u64));
            assert_eq!(project_id2, Nat::from(1u64));
        });
    }

    #[test]
    fn test_project_with_multiple_collaborators() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let collaborators = vec![
            "researcher1@uni.edu".to_string(),
            "researcher2@uni.edu".to_string(),
            "researcher3@uni.edu".to_string(),
            "researcher4@uni.edu".to_string(),
        ];

        let project = Project {
            id: Nat::from(1u64),
            creator,
            name: "Multi-collaborator Project".to_string(),
            description: "Large team research".to_string(),
            category: "Multi-disciplinary".to_string(),
            status: ProjectStatus::Active,
            progress: 25,
            collaborators: collaborators.clone(),
            datasets: 10,
            start_date: Some("2024-01-01".to_string()),
            end_date: Some("2025-01-01".to_string()),
            budget: Nat::from(100000u64),
            created_at: 1000,
        };

        assert_eq!(project.collaborators.len(), 4);
        assert_eq!(project.collaborators, collaborators);
    }

    #[test]
    fn test_project_with_no_collaborators() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let project = Project {
            id: Nat::from(1u64),
            creator,
            name: "Solo Project".to_string(),
            description: "Individual research".to_string(),
            category: "Independent".to_string(),
            status: ProjectStatus::Planning,
            progress: 0,
            collaborators: vec![],
            datasets: 0,
            start_date: None,
            end_date: None,
            budget: Nat::from(5000u64),
            created_at: 1000,
        };

        assert_eq!(project.collaborators.len(), 0);
    }

    #[test]
    fn test_large_reward_bounty() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let bounty = Bounty {
            id: Nat::from(1u64),
            creator,
            title: "High-value Task".to_string(),
            description: "Complex analysis required".to_string(),
            reward: Nat::from(1_000_000u64), // 1 million tokens
            status: BountyStatus::Open,
            created_at: 1000,
            winner: None,
        };

        assert_eq!(bounty.reward, Nat::from(1_000_000u64));
    }

    #[test]
    fn test_project_categories() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let categories = vec![
            "Oncology",
            "Cardiology",
            "Neurology",
            "Radiology",
            "Genomics",
            "Epidemiology",
        ];

        for (i, category) in categories.iter().enumerate() {
            let project = Project {
                id: Nat::from(i as u64),
                creator: creator.clone(),
                name: format!("{} Project", category),
                description: format!("Research in {}", category),
                category: category.to_string(),
                status: ProjectStatus::Planning,
                progress: 0,
                collaborators: vec![],
                datasets: 0,
                start_date: None,
                end_date: None,
                budget: Nat::from(10000u64),
                created_at: 1000,
            };

            assert_eq!(project.category, *category);
        }
    }

    #[test]
    fn test_project_with_large_dataset_count() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        
        let project = Project {
            id: Nat::from(1u64),
            creator,
            name: "Big Data Project".to_string(),
            description: "Large scale analysis".to_string(),
            category: "Big Data".to_string(),
            status: ProjectStatus::Active,
            progress: 60,
            collaborators: vec![],
            datasets: 1000,
            start_date: None,
            end_date: None,
            budget: Nat::from(500000u64),
            created_at: 1000,
        };

        assert_eq!(project.datasets, 1000);
    }

    #[test]
    fn test_bounty_lifecycle_statuses() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();
        let winner = Principal::from_text("bbbbb-bb").unwrap();

        // Open bounty
        let bounty_open = Bounty {
            id: Nat::from(1u64),
            creator: creator.clone(),
            title: "New Bounty".to_string(),
            description: "Just created".to_string(),
            reward: Nat::from(1000u64),
            status: BountyStatus::Open,
            created_at: 1000,
            winner: None,
        };

        // In progress
        let bounty_progress = Bounty {
            id: Nat::from(2u64),
            creator: creator.clone(),
            title: "In Progress Bounty".to_string(),
            description: "Being worked on".to_string(),
            reward: Nat::from(2000u64),
            status: BountyStatus::InProgress,
            created_at: 2000,
            winner: None,
        };

        // Completed
        let bounty_completed = Bounty {
            id: Nat::from(3u64),
            creator: creator.clone(),
            title: "Completed Bounty".to_string(),
            description: "Finished".to_string(),
            reward: Nat::from(3000u64),
            status: BountyStatus::Completed,
            created_at: 3000,
            winner: Some(winner),
        };

        // Cancelled
        let bounty_cancelled = Bounty {
            id: Nat::from(4u64),
            creator,
            title: "Cancelled Bounty".to_string(),
            description: "No longer needed".to_string(),
            reward: Nat::from(4000u64),
            status: BountyStatus::Cancelled,
            created_at: 4000,
            winner: None,
        };

        // Verify statuses
        assert!(matches!(bounty_open.status, BountyStatus::Open));
        assert!(matches!(bounty_progress.status, BountyStatus::InProgress));
        assert!(matches!(bounty_completed.status, BountyStatus::Completed));
        assert!(matches!(bounty_cancelled.status, BountyStatus::Cancelled));

        // Verify winner assignment
        assert!(bounty_completed.winner.is_some());
        assert!(bounty_open.winner.is_none());
        assert!(bounty_cancelled.winner.is_none());
    }

    #[test]
    fn test_project_lifecycle_statuses() {
        let creator = Principal::from_text("aaaaa-aa").unwrap();

        let statuses_and_progress = vec![
            (ProjectStatus::Planning, 0),
            (ProjectStatus::Active, 35),
            (ProjectStatus::Completed, 100),
            (ProjectStatus::Cancelled, 50),
        ];

        for (i, (status, progress)) in statuses_and_progress.into_iter().enumerate() {
            let project = Project {
                id: Nat::from(i as u64),
                creator: creator.clone(),
                name: format!("Project {}", i),
                description: "desc".to_string(),
                category: "cat".to_string(),
                status: status.clone(),
                progress,
                collaborators: vec![],
                datasets: i as u32,
                start_date: None,
                end_date: None,
                budget: Nat::from(1000u64),
                created_at: 1000,
            };

            assert!(matches!(project.status, ProjectStatus::Planning | ProjectStatus::Active | ProjectStatus::Completed | ProjectStatus::Cancelled));
            assert_eq!(project.progress, progress);
        }
    }
}