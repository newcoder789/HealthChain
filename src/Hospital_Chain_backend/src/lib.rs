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

// User role enum for multi-role user system
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq)]
enum UserRole {
    Patient,
    Doctor,
    Researcher,
}

// User profile to replace PatientProfile
#[derive(CandidType, Deserialize, Serialize, Clone)]
struct UserProfile {
    user_id: Principal,
    role: UserRole,
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
        candid::encode_one(self).expect("Failed to encode MedicalRecord")
    }

    const BOUND: Bound = Bound::Unbounded;
}

// Storable for the new UserProfile
impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode UserProfile"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode UserProfile")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode MedicalRecord")
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
        candid::encode_one(self).expect("Failed to encode MedicalRecord")
    }
    const BOUND: Bound = Bound::Unbounded;
}

// --- Storage ---

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(memory_manager::MemoryManager::init(DefaultMemoryImpl::default()));

    // Changed from PATIENTS to USERS to support all user types
    static USERS: RefCell<StableBTreeMap<Vec<u8>, UserProfile, Memory>> = RefCell::new(
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
    ic_cdk::api::msg_caller()
}
// New helper function to enforce user roles
fn get_user_profile() -> Result<UserProfile, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    USERS.with(|users| {
        users.borrow().get(&caller_bytes).ok_or("User not registered".to_string())
    })
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
fn register_user(role: UserRole) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    let already_registered = USERS.with(|users| {
        users.borrow().contains_key(&caller_bytes)
    });
    
    if already_registered {
        return Err("User already registered".to_string());
    }

    let profile = UserProfile {
        user_id: caller,
        role,
        created_at: ic_cdk::api::time(),
        records: vec![],
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller_bytes, profile);
    });

    Ok("User registered successfully".to_string())
}


#[update]
fn upload_record(file_data: ByteBuf, file_type: String, parent_folder_id: Option<String>) -> Result<String, String> {
    let caller = get_caller();
    
    // Role check: Only patients can upload records.
    let user_profile = get_user_profile()?;
    if user_profile.role != UserRole::Patient {
        return Err("Only patients can upload medical records".to_string());
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

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller.as_slice().to_vec()) {
            profile.records.push(record_id.clone());
            users_mut.insert(caller.as_slice().to_vec(), profile);
        }
    });

    log_action(record_id.clone(), "upload".to_string());
    Ok(record_id)
}

#[update]
fn create_folder(folder_name: String, parent_folder_id: Option<String>) -> Result<String, String> {
    let caller = get_caller();
    
    // Role check: Only patients can create folders.
    let user_profile = get_user_profile()?;
    if user_profile.role != UserRole::Patient {
        return Err("Only patients can create folders".to_string());
    }
    
    let folder_id_data = format!("{}-{}", caller.to_text(), ic_cdk::api::time());
    let folder_id = generate_hash(folder_id_data.as_bytes());

    let folder_record: MedicalRecord = MedicalRecord {
        record_id: folder_id.clone(),
        owner: caller,
        file_hash: "".to_string(),
        file_type: "folder".to_string(),
        timestamp: ic_cdk::api::time(),
        access_list: HashMap::new(),
        parent_folder_id,
    };

    RECORDS.with(|records| {
        records.borrow_mut().insert(folder_id.clone(), folder_record);
    });
    
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller.as_slice().to_vec()) {
            profile.records.push(folder_id.clone());
            users_mut.insert(caller.as_slice().to_vec(), profile);
        }
    });

    log_action(folder_id.clone(), "create_folder".to_string());
    Ok(folder_id)
}

#[update]
fn revoke_access(record_id: String, to_principal: Principal) -> Result<(), String> {
    let caller = get_caller();

    RECORDS.with(|records| {
        let mut records_ref = records.borrow_mut();
        
        if let Some(mut record) = records_ref.get(&record_id) {
            if record.owner != caller {
                return Err("Record not owned by caller".to_string());
            }

            record.access_list.remove(&to_principal);
            records_ref.insert(record_id.clone(), record);
            
            log_action(record_id, format!("revoke_access_from_{}", to_principal.to_text()));
            Ok(())
        } else {
            Err("Record not found".to_string())
        }
    })
}

#[query]
fn get_my_records() -> Result<Vec<MedicalRecord>, String> {
    let caller = get_caller();
    
    // Role check: Only patients can view their own records.
    let user_profile = get_user_profile()?;
    if user_profile.role != UserRole::Patient {
        return Err("Only patients can view their own records".to_string());
    }

    let record_ids = USERS.with(|users| {
        let caller_bytes = caller.as_slice().to_vec();
        users.borrow().get(&caller_bytes).map(|profile| profile.records.clone()).ok_or("User not found".to_string())
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
    
    // Role check: Only patients can grant access to their records.
    let user_profile = get_user_profile()?;
    if user_profile.role != UserRole::Patient {
        return Err("Only patients can grant access to records".to_string());
    }

    RECORDS.with(|records| {
        let mut records_ref = records.borrow_mut();
        
        if let Some(mut record) = records_ref.get(&record_id) {
            if record.owner != caller {
                return Err("Record not owned by caller".to_string());
            }

            record.access_list.insert(to_principal, permission);
            records_ref.insert(record_id.clone(), record);
            
            log_action(record_id, format!("grant_access_to_{}", to_principal.to_text()));
            Ok(())
        } else {
            Err("Record not found".to_string())
        }
    })
}

#[query]
fn shared_with_me() -> Result<Vec<MedicalRecord>, String> {
    let caller = get_caller();
    
    // Role check: Doctors and researchers can view shared records.
    let user_profile = get_user_profile()?;
    if user_profile.role == UserRole::Patient {
        return Err("Patients do not have a 'shared with me' view".to_string());
    }
    
    let result = RECORDS.with(|records| {
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
    });

    Ok(result)
}

#[update]
fn submit_for_research(record_id: String) -> Result<(), String> {
    let caller = get_caller();
    
    // Role check: Only patients can submit records for research.
    let user_profile = get_user_profile()?;
    if user_profile.role != UserRole::Patient {
        return Err("Only patients can submit records for research".to_string());
    }

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
fn get_profile() -> Result<UserProfile, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    USERS.with(|users| {
        users.borrow().get(&caller_bytes).ok_or("User not found".to_string())
    })
}

#[update]
fn update_settings() -> Result<(), String> {
    let caller = get_caller();
    let exists = USERS.with(|users| users.borrow().contains_key(&caller.as_slice().to_vec()));
    if !exists {
        return Err("User not found".to_string());
    }

    log_action("profile".to_string(), "update_settings".to_string());
    Ok(())
}

#[init]
fn init() {}

ic_cdk::export_candid!();