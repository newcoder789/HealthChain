use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{init, query, update};
use ic_stable_structures::memory_manager::{self, MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{storable::Bound, DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::Serialize;
use serde_bytes::ByteBuf;
use sha2::{Sha256, Digest};
use std::cell::RefCell;
use std::collections::HashMap;
use std::borrow::Cow;
use ic_cdk::api::msg_caller;
// --- Data Structures ---

#[derive(CandidType, Deserialize, Serialize, Clone)]
struct MedicalRecord {
    record_id: String,
    owner: Principal,
    file_hash: String,
    file_type: String,
    timestamp: u64,
    access_list: HashMap<Principal, AccessPermission>,
    parent_folder_id: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
struct AccessPermission {
    can_view: bool,
    can_edit: bool,
    can_share: bool,
    is_anonymized: bool,
    expiry: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
struct PatientProfile {
    user_id: Principal,
    created_at: u64,
    records: Vec<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
struct AuditLog {
    record_id: String,
    actor: Principal,
    action: String,
    timestamp: u64,
}

// --- Storable Implementations ---

impl Storable for MedicalRecord {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode MedicalRecord"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode MedicalRecord")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode MedicalRecord")
    }
    const BOUND: Bound = Bound::Unbounded;
}
impl Storable for AccessPermission {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode AccessPermission"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode AccessPermission")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode AccessPermission")
    }
    const BOUND: Bound = Bound::Unbounded;
}
impl Storable for PatientProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode PatientProfile"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode PatientProfile")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode PatientProfile")
    }
    const BOUND: Bound = Bound::Unbounded;
}   
impl Storable for AuditLog {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode AuditLog"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode AuditLog")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode AuditLog")
    }
    const BOUND: Bound = Bound::Unbounded;
}

// --- Storage ---

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(memory_manager::MemoryManager::init(DefaultMemoryImpl::default()));

    static PATIENTS: RefCell<StableBTreeMap<Vec<u8>, PatientProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static RECORDS: RefCell<StableBTreeMap<String, MedicalRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static AUDIT_LOGS: RefCell<StableBTreeMap<u64, AuditLog, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
}

// --- Helper Functions ---

fn generate_hash(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

fn get_caller() -> Principal {
    msg_caller()
}

fn log_action(record_id: String, action: String) {
    let log = AuditLog {
        record_id,
        actor: get_caller(),
        action,
        timestamp: ic_cdk::api::time(),
    };
    AUDIT_LOGS.with(|logs| {
        logs.borrow_mut().insert(ic_cdk::api::time(), log);
    });
}


// --- Canister Endpoints ---
#[update]
fn register_user() -> Result<String, String> {
    // Get the caller's principal (their unique identifier on the IC).
    let caller = get_caller();

    // Use `PATIENTS` to check if the caller is already registered.
    let already_registered = PATIENTS.with(|patients| {
        let patients_ref = patients.borrow();
        patients_ref.contains_key(&caller.as_slice().to_vec())
    });
    if already_registered {
        // Return an error if the user already exists.
        return Err("User already registered".to_string());
    }

    // Create a new PatientProfile.
    let profile = PatientProfile {
        user_id: caller,
        created_at: ic_cdk::api::time(),
        records: vec![], // A new user has no medical records yet.
    };

    // Insert the new profile into the `PATIENTS` map.
    PATIENTS.with(|patients| {
        let mut patients_mut = patients.borrow_mut();
        patients_mut.insert(caller.as_slice().to_vec(), profile);
    });

    Ok("User registered successfully".to_string())
}


#[update]
fn upload_record(file_data: ByteBuf, file_type: String, parent_folder_id: Option<String>) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    let patient_exists = PATIENTS.with(|patients| patients.borrow().contains_key(&caller_bytes));
    if !patient_exists {
        return Err("Patient not registered".to_string());
    }

    let record_id = generate_hash(&file_data);
    let file_hash = record_id.clone();

    let mut access_list = HashMap::new();
    access_list.insert(caller, AccessPermission {
        can_view: true,
        can_edit: true,
        can_share: true,
        is_anonymized: false,
        expiry: None,
    });

    let record = MedicalRecord {
        record_id: record_id.clone(),
        owner: caller,
        file_hash,
        file_type,
        timestamp: ic_cdk::api::time(),
        access_list,
        parent_folder_id, 
    };

    RECORDS.with(|records| {
        records.borrow_mut().insert(record_id.clone(), record);
    });

    PATIENTS.with(|patients| {
        let mut patients_mut = patients.borrow_mut();
        if let Some(mut profile) = patients_mut.get(&caller.as_slice().to_vec()) {
            profile.records.push(record_id.clone());
            patients_mut.insert(caller.as_slice().to_vec(), profile);
        }
    });

    log_action(record_id.clone(), "upload".to_string());
    Ok(record_id)
}

#[query]
fn get_my_records() -> Result<Vec<MedicalRecord>, String> {
    let caller = get_caller();
    let record_ids = PATIENTS.with(|patients| {
        let caller_bytes = caller.as_slice().to_vec();
        patients.borrow().get(&caller_bytes).map(|profile| profile.records.clone()).ok_or("Patient not found".to_string())
    })?;

    let result = RECORDS.with(|records| {
        let records_map = records.borrow();
        record_ids.iter()
            .filter_map(|id| records_map.get(id))
            .collect()
    });

    Ok(result)
}

#[update]
fn grant_access(record_id: String, to_principal: Principal, permission: AccessPermission) -> Result<(), String> {
    let caller = get_caller();
    let record_exists = RECORDS.with(|records| {
        records.borrow().get(&record_id).map(|record| record.owner == caller).unwrap_or(false)
    });

    if !record_exists {
        return Err("Record not found or not owned by caller".to_string());
    }

    RECORDS.with(|records| {
        let mut records_ref = records.borrow_mut();
        if let Some(mut record) = records_ref.get(&record_id) {
            record.access_list.insert(to_principal, permission);
            records_ref.insert(record_id.clone(), record);
        }
    });

    log_action(record_id, format!("grant_access_to_{}", to_principal.to_text()));
    Ok(())
}

#[query]
fn shared_with_me() -> Vec<MedicalRecord> {
    let caller = get_caller();
    RECORDS.with(|records| {
        records.borrow().iter()
            .filter_map(|entry| {
                let record = entry.value();
                if record.access_list.contains_key(&caller) {
                    Some(record.clone())
                } else {
                    None
                }
            })
            .collect()
    })
}

#[update]
fn submit_for_research(record_id: String) -> Result<(), String> {
    let caller = get_caller();
    if !RECORDS.with(|records| records.borrow().get(&record_id).map_or(false, |r| r.owner == caller)) {
        return Err("Record not found or not owned by caller".to_string());
    }

    RECORDS.with(|records| {
        let mut records_ref = records.borrow_mut();
        if let Some(mut record) = records_ref.get(&record_id) {
            record.access_list.insert(Principal::anonymous(), AccessPermission {
                can_view: true,
                can_edit: false,
                can_share: false,
                is_anonymized: true,
                expiry: None,
            });
            records_ref.insert(record_id.clone(), record);
        }
    });

    log_action(record_id, "submit_for_research".to_string());
    Ok(())
}

#[query]
fn get_profile() -> Result<PatientProfile, String> {
    let caller = get_caller();
    PATIENTS.with(|patients| {
        let caller_bytes = caller.as_slice().to_vec();
        patients.borrow().get(&caller_bytes).ok_or("Patient not found".to_string())
    })
}

#[update]
fn update_settings() -> Result<(), String> {
    let caller = get_caller();
    let exists = PATIENTS.with(|patients| patients.borrow().contains_key(&caller.as_slice().to_vec()));
    if !exists {
        return Err("Patient not found".to_string());
    }

    log_action("profile".to_string(), "update_settings".to_string());
    Ok(())
}

#[init]
fn init() {
    let caller = get_caller();
    PATIENTS.with(|patients| {
        let mut patients_mut = patients.borrow_mut();
        let caller_bytes = caller.as_slice().to_vec();
        if !patients_mut.contains_key(&caller_bytes) {
            let profile = PatientProfile {
                user_id: caller,
                created_at: ic_cdk::api::time(),
                records: vec![],
            };
            patients_mut.insert(caller_bytes, profile);
        }
    });
}

ic_cdk::export_candid!();