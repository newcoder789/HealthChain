use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{init, query, update};
use ic_stable_structures::memory_manager::{self, MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{storable::Bound, DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::Serialize;
use sha2::{Sha256, Digest};
use std::cell::RefCell;
use std::collections::HashMap;
use std::borrow::Cow;
use ic_cdk::api::time;
use ic_cdk::api::msg_caller;
// --- Data Structures ---

// ---Medical Records & Metadata ---
type AccessList = HashMap<Principal, AccessPermission>;
#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct MedicalRecord {
    record_id: String,
    owner: String,
    file_cid: String,
    file_name: Option<String>,
    file_type: String,
    file_size: Option<u64>,
    aes_key_enc_for_owner: Vec<u8>,
    per_principal_keys: Vec<EncryptedKeyForPrincipal>,
    timestamp: u64,
    parent_folder_id: Option<String>,
    tags: Vec<String>,
    references: Vec<String>,
    derived_artifacts: Vec<String>,
    metadata_completeness_score: u8,
    uses_standard_codes: bool,
    plausibility_flags: Vec<String>,
    access_list: AccessList,
    latest_version_id: Option<String>,
    is_anonymized: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct RecordVersion {
    version_id: String,
    record_id: String,
    file_cid: String,
    change_note: String,
    previous_version_id: Option<String>,
    uploader: String,
    timestamp: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct AccessGrant {
    principal_text: String,
    can_view: bool,
    can_edit: bool,
    can_share: bool,
    is_anonymized: bool,
    expires_at: Option<u64>,
    granted_at: u64,
    granted_by: String,
}


#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct EncryptedKeyForPrincipal {
    principal_text: String,
    encrypted_key: Vec<u8>,
    expires_at: Option<u64>,
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
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
pub enum UserRole { Patient, Doctor, Researcher, Admin }



#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    user_id: Principal,
    name: Option<String>, 
    created_at: u64,
    records: Vec<String>,
    principal_text: String,
    email_hash: Option<String>,
    roles: Vec<UserRole>,                   // Patient, Doctor, Researcher, Admin
    verified_tier: VerifiedTier,            // Basic or Verified
    nationality: Option<String>,            // optional verified field
    proof_of_identity: Option<VerificationEvidence>,
    identity_status: IdentityStatus,        // Pending/Approved/Rejected/Expired
    profile: Option<UserProfile>,
    verification_badge: Option<VerificationBadge>,
    records_index: Vec<String>,
    research_submissions: Vec<String>,
    public_stats: Option<PublicStats>,      // summary counts visible if consented
    reward_multiplier: f32,
    settings: PrivacySettings,
    tokens: TokenBalance,
    audit_pointer: Vec<u64>,                 // log IDs for quick lookup
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct AuditLogEntry {
    id: u64,
    actor: String,
    action: String,
    record_id: Option<String>,
    target: Option<String>,
    meta_cid: Option<String>,
    timestamp: u64,
}


// ----- Enums & helper structs ----
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
enum VerifiedTier { Basic, Verified }

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
enum IdentityStatus { Pending, Approved, Rejected, Expired }

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct PrivacySettings{

}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct VerificationBadge {
    verified: bool,
    issuer: String,
    issued_at: u64,
    expires_at: Option<u64>,
    evidence_cid: Option<String>,
    badge_signature: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct TokenBalance{
    
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct PublicStats {
    record_count: u32,
    tags: Vec<String>,
    region: Option<String>,
    age_band: Option<String>,
    visible: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct UserProfile {
    avatar_cid: Option<String>,
    bio: Option<String>,
    phone_hash: Option<String>,
    meta: Option<HashMap<String,String>>,
}
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct VerificationEvidence { evidence_cid: String, uploaded_at: u64 }




// 6--- Research Marketplace, Consent & Tokenomics ---
pub struct Consent {
    consent_id: String,
    owner_principal: String,
    researcher_principal: Option<String>,
    scope: String,
    purpose: String,
    expires_at: Option<u64>,
    created_at: u64,
    consent_evidence_cid: Option<String>,
    revoked_at: Option<u64>,
}

pub struct ResearchSubmission {
    submission_id: String,
    owner: String,
    aggregated_cid: String,
    researcher_principal: Option<String>,
    reward_amount: u128,
    provenance_cid: Option<String>,
    consent_ids: Vec<String>,
    created_at: u64,
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

impl Storable for User {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode User"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode User")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode User")
    }
    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for AuditLogEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode AuditLogEntry"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode AuditLogEntry")
    }
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode AuditLogEntry")
    }
    const BOUND: Bound = Bound::Unbounded;
}

// --- Storage ---

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(memory_manager::MemoryManager::init(DefaultMemoryImpl::default()));

    static USERS: RefCell<StableBTreeMap<Vec<u8>, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static USER_NAME_TO_PRINCIPAL: RefCell<StableBTreeMap<String, Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    static RECORDS: RefCell<StableBTreeMap<String, MedicalRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static AUDIT_LOGS: RefCell<StableBTreeMap<u64, AuditLogEntry, Memory>> = RefCell::new(
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

fn get_user_profile() -> Result<User, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    USERS.with(|users| {
        users.borrow().get(&caller_bytes).ok_or("User not registered".to_string())
    })
}

fn log_action(record_id: String, action: String) {
    let log = AuditLogEntry {
        record_id,
        actor: get_caller().to_string(),
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

    let profile = User {
        user_id: caller,
        role: vec![role],
        name: None,
        created_at: ic_cdk::api::time(),
        records: vec![],
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller_bytes, profile);
    });

    Ok("User registered successfully".to_string())
}

#[update]
fn update_user_name(name: String) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller_bytes) {

            if USER_NAME_TO_PRINCIPAL.with(|map| map.borrow().contains_key(&name)) {
                return Err("This username is already taken".to_string());
            }

            if let Some(old_name) = profile.name.clone() {
                USER_NAME_TO_PRINCIPAL.with(|map| map.borrow_mut().remove(&old_name));
            }

            profile.name = Some(name.clone());
            users_mut.insert(caller_bytes, profile);
            USER_NAME_TO_PRINCIPAL.with(|map| map.borrow_mut().insert(name.clone(), caller));

            Ok(format!("User name updated to {}", name))
        } else {
            Err("User not found".to_string())
        }
    })
}

#[update]
fn add_user_role(new_role: UserRole) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(profile) = users_mut.get(&caller_bytes) {
            let has_role = profile.role.iter().any(|r| r == &new_role);
            if !has_role {
                let mut new_profile = profile.clone();
                new_profile.role.push(new_role);
                users_mut.insert(caller_bytes, new_profile);
                Ok("Role added to user".to_string())
            } else {
                Err("User already has this role".to_string())
            }
        } else {
            Err("User not found".to_string())
        }
    })
}

#[update]
fn upload_record(file_hash: String, file_type: String, file_name: String, parent_folder_id: Option<String>) -> Result<String, String> {
    let caller = get_caller();
    let user_profile = get_user_profile()?;

    if !user_profile.role.contains(&UserRole::Patient) {
        return Err("Only patients can upload medical records".to_string());
    }

    let record_id_data = format!("{}-{}", file_hash, ic_cdk::api::time());
    let record_id = generate_hash(record_id_data.as_bytes());

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
        file_name: Some(file_name),
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
    let user_profile = get_user_profile()?;

    if !user_profile.role.contains(&UserRole::Patient) {
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
        file_name: Some(folder_name)
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
    let user_profile = get_user_profile()?;

    if !user_profile.role.contains(&UserRole::Patient) {
        return Err("Only patients can view their own records".to_string());
    }

    let record_ids = USERS.with(|users| {
        users.borrow().get(&caller.as_slice().to_vec()).map(|profile| profile.records.clone()).ok_or("User not found".to_string())
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
    let user_profile = get_user_profile()?;

    if !user_profile.role.contains(&UserRole::Patient) {
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
    let user_profile = get_user_profile()?;

    if user_profile.role.contains(&UserRole::Patient) {
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
    let user_profile = get_user_profile()?;

    if !user_profile.role.contains(&UserRole::Patient) {
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

#[query]
fn get_principal_by_name(name: String) -> Result<Principal, String> {
    USER_NAME_TO_PRINCIPAL.with(|map| {
        map.borrow().get(&name).ok_or("User not found".to_string())
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
