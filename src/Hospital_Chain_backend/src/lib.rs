use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{init, query, update};
use ic_stable_structures::memory_manager::{self, MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{storable::Bound, DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::cell::RefCell;
use std::collections::HashMap;
use std::borrow::Cow;
use ic_cdk::api::time;
use ic_cdk::api::msg_caller;
use std::collections::HashSet;

// --- Data Structures ---

// ---Medical Records & Metadata ---
type AccessList = HashMap<Principal, AccessPermission>;
#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct MedicalRecord {
    record_id: String,
    owner: Principal,
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

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct ActiveShare {
    grant_id: String, // A unique ID for the grant, e.g., record_id:grantee_principal
    grantee_principal: String,
    grantee_name: Option<String>,
    record_id: String,
    record_name: Option<String>,
    permissions: AccessPermission,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct SharedRecordIdList {
    record_ids: Vec<String>,
}


// A new struct to return enriched shared record data
#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct SharedRecordInfo {
    record: MedicalRecord,
    owner_name: Option<String>,
    owner_is_verified: bool,
}


#[derive(CandidType, Deserialize, Serialize, Clone)]
pub enum RequestStatus { Pending, Approved, Denied }

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct AccessRequest {
    request_id: String,
    record_id: String,
    record_name: Option<String>,
    requester_principal: String,
    requester_name: Option<String>,
    owner_principal: String,
    status: RequestStatus,
    message: String,
    requested_at: u64,
    resolved_at: Option<u64>,
}

// User role enum for multi-role user system
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
pub enum UserRole { Patient, Doctor, Researcher, Admin }


#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct User {
    user_id: Option<Principal>,
    name: Option<String>,   
    created_at: u64,
    records: Vec<String>,
    principal_text: String,
    email_hash: Option<String>,
    roles: Vec<UserRole>,
    verified_tier: VerifiedTier,
    nationality: Option<String>,
    proof_of_identity: Option<VerificationEvidence>,
    identity_status: IdentityStatus,
    profile: Option<UserProfile>,
    verification_badge: Option<VerificationBadge>,
    records_index: Vec<String>,
    research_submissions: Vec<String>,
    public_stats: Option<PublicStats>,
    reward_multiplier: f32,
    settings: PrivacySettings,
    tokens: TokenBalance,
    audit_pointer: Vec<u64>,
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

// Manually implement Default for VerifiedTier
impl Default for VerifiedTier {
    fn default() -> Self {
        VerifiedTier::Basic
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
enum IdentityStatus { Pending, Approved, Rejected, Expired }

// Manually implement Default for IdentityStatus
impl Default for IdentityStatus {
    fn default() -> Self {
        IdentityStatus::Pending
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
enum Sex { Male, Female, Other }


#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct PrivacySettings {
    /// Whether the user consents to share de-identified data for research.
    pub allow_research_use: bool,

    /// Whether the user’s public stats (record counts, tags, region) are visible.
    pub show_public_stats: bool,

    /// Default sharing level for new uploads.
    /// "Private" = only owner, "TrustedDoctors" = doctors with badges,
    /// "PublicAnonymized" = anyone with anonymization applied.
    pub default_sharing_scope: Option<SharingScope>,

    /// Require explicit approval before a doctor/researcher can request access.
    pub require_manual_approval: bool,

    /// Whether watermarking is applied to all read-only views.
    pub watermark_on_view: bool,

    /// Timestamp after which unused consents or access grants should auto-expire.
    pub auto_expire_days: Option<u32>,

    /// Whether to notify the user whenever their record is accessed.
    pub notify_on_access: bool,

    /// Regions/countries to which data transfer is allowed (e.g., comply with DPDPA cross-border rules).
    pub allowed_data_regions: Vec<String>,

    /// Optional metadata for future extensions or hospital-specific policies.
    pub custom_prefs: Option<HashMap<String, String>>,

    // New notification preferences
    pub email_updates: bool,
    pub access_alerts: bool,
    pub security_alerts: bool,
    pub research_updates: bool,

    // Privacy settings
    pub profile_visibility: String,
    pub analytics: bool,
}

impl Default for PrivacySettings {
    fn default() -> Self {
        Self {
            allow_research_use: false,
            show_public_stats: false,
            default_sharing_scope: None,
            require_manual_approval: false,
            watermark_on_view: false,
            auto_expire_days: None,
            notify_on_access: false,
            allowed_data_regions: vec![],
            custom_prefs: None,
            email_updates: true,
            access_alerts: true,
            security_alerts: true,
            research_updates: false,
            profile_visibility: "private".to_string(),
            analytics: true,
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
pub enum SharingScope {
    Private,
    TrustedDoctors,
    PublicAnonymized,
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

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug, Default)]
struct TokenBalance{

}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug, Default)]
struct PublicStats {
    record_count: u32,
    tags: Vec<String>,
    region: Option<String>,
    age_band: Option<String>,
    visible: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug, Default)]
struct UserProfile {
    name: Option<String>,
    avatar_cid: Option<String>,
    bio: Option<String>,
    phone_hash: Option<String>,
    email: Option<String>,
    age: Option<String>,
    sex: Option<Sex>,
    ethnicity: Option<String>,
    meta: Option<HashMap<String,String>>,
    nationality: Option<String>,
}
#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
struct VerificationEvidence { evidence_cid: String, uploaded_at: u64 }

// Manually implement Default for VerificationEvidence
impl Default for VerificationEvidence {
    fn default() -> Self {
        Self {
            evidence_cid: "".to_string(),
            uploaded_at: 0,
        }
    }
}


#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
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
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
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

impl Storable for SharedRecordIdList {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode SharedRecordIdList"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode SharedRecordIdList")
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode SharedRecordIdList")
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
impl Storable for AccessRequest {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Failed to encode AccessRequest"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("Failed to decode AccessRequest")
    }
    
    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(self).expect("Failed to encode AccessRequest")
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

    static ACCESS_REQUESTS: RefCell<StableBTreeMap<String, AccessRequest, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );

    static SHARED_RECORDS_INDEX: RefCell<StableBTreeMap<Principal, SharedRecordIdList, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5)))
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

#[warn(dead_code)]
fn get_user_profile() -> Option<User> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    USERS.with(|users| {
        users.borrow().get(&caller_bytes)
    })
}

fn log_action(record_id: Option<String>, action: String, target: Option<String>, meta_cid: Option<String>) -> u64 {
    let timestamp = ic_cdk::api::time();
    let log = AuditLogEntry {
        id: timestamp,
        actor: get_caller().to_string(),
        action,
        record_id,
        target,
        meta_cid,
        timestamp,
    };
    AUDIT_LOGS.with(|logs| logs.borrow_mut().insert(timestamp, log));
    timestamp
}

#[update]
fn get_or_create_user_profile() -> User {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();
    let default_admin_principal = Principal::from_text("2yq74-dyvun-4jltq-lkpbl-jcoao-kj4pl-7qemg-sbkrs-p3neo-47oxb-mqe").unwrap();

    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        if let Some(mut user) = users_map.get(&caller_bytes) {
            // Ensure the default admin always has the admin role
            if user.user_id == Some(default_admin_principal) && !user.roles.contains(&UserRole::Admin) {
                user.roles.push(UserRole::Admin);
                users_map.insert(caller_bytes, user.clone());
            }
            user
        } else {
            let mut roles = vec![UserRole::Patient, UserRole::Researcher, UserRole::Doctor];
            if caller == default_admin_principal {
                roles.push(UserRole::Admin);
            }
            let new_user = User {
                user_id: Some(caller),
                created_at: ic_cdk::api::time(),
                name: None, // Name can be set later via update_profile
                records: vec![],
                principal_text: caller.to_string(),
                email_hash: None,
                roles,
                verified_tier: VerifiedTier::Basic,
                nationality: None,
                proof_of_identity: None,
                identity_status: IdentityStatus::Pending,
                profile: None,
                verification_badge: None,
                records_index: vec![],
                research_submissions: vec![],
                public_stats: None,
                reward_multiplier: 1.0,
                settings: PrivacySettings::default(),
                tokens: TokenBalance::default(),
                audit_pointer: vec![],
            };
            users_map.insert(caller_bytes, new_user.clone());
            new_user
        }
    })
}

// --- Canister Endpoints ---

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

            let log_timestamp = log_action(None, "update_user_name".to_string(), None, None);

            profile.name = Some(name.clone());
            profile.audit_pointer.push(log_timestamp);
            let updated_profile = profile.clone(); // Re-assigning to avoid borrow issues
            users_mut.insert(caller_bytes, updated_profile);
            USER_NAME_TO_PRINCIPAL.with(|map| map.borrow_mut().insert(name.clone(), caller));

            Ok(format!("User name updated to {}", name))
        } else {
            Err("User not found. Please create a profile first.".to_string())
        }
    })
}

#[update]
fn add_admin(principal: Principal) -> Result<String, String> {
    let caller = get_caller();
    let caller_profile = get_or_create_user_profile();

    // Ensure only an admin can call this function
    if !caller_profile.roles.contains(&UserRole::Admin) {
        return Err("You are not authorized to perform this action.".to_string());
    }

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&principal.as_slice().to_vec()) {
            if !user.roles.contains(&UserRole::Admin) {
                user.roles.push(UserRole::Admin);
                users_mut.insert(principal.as_slice().to_vec(), user);
            }
            Ok(format!("{} is now an admin.", principal.to_text()))
        } else {
            Err("User not found. The user must log in at least once.".to_string())
        }
    })
}

#[update]
fn add_user_role(new_role: UserRole) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller_bytes) {
            let has_role = profile.roles.iter().any(|r| r == &new_role);
            if !has_role {
                profile.roles.push(new_role);
                users_mut.insert(caller_bytes, profile);
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
fn upload_record(file_cid: String, file_type: String, file_name: String, parent_folder_id: Option<String>, file_size: u64) -> Result<String, String> {
    let caller = get_caller();
    let _user_profile = get_or_create_user_profile();

    let record_id_data = format!("{}-{}", file_cid, ic_cdk::api::time());
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
        file_cid: file_cid.clone(),
        file_type: file_type.clone(),
        file_name: Some(file_name),
        file_size: Some(file_size),
        aes_key_enc_for_owner: Vec::new(),
        per_principal_keys: Vec::new(),
        timestamp: ic_cdk::api::time(),
        parent_folder_id,
        tags: Vec::new(),
        references: Vec::new(),
        derived_artifacts: Vec::new(),
        metadata_completeness_score: 0,
        uses_standard_codes: false,
        plausibility_flags: Vec::new(),
        access_list,
        latest_version_id: None,
        is_anonymized: false,
    };

    RECORDS.with(|records| {
        records.borrow_mut().insert(record_id.clone(), record);
    });

    let log_timestamp = log_action(Some(record_id.clone()), "upload".to_string(), None, Some(file_cid));
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller.as_slice().to_vec()) {
            profile.records.push(record_id.clone());
            profile.audit_pointer.push(log_timestamp);
            users_mut.insert(caller.as_slice().to_vec(), profile);
        }
    });
    Ok(record_id)
}

#[update]
fn create_folder(folder_name: String, parent_folder_id: Option<String>) -> Result<String, String> {
    let caller = get_caller();
    let _user_profile = get_or_create_user_profile();
    let folder_id_data = format!("{}-{}", caller.to_string(), ic_cdk::api::time());
    let folder_id = generate_hash(folder_id_data.as_bytes());

    let folder_record: MedicalRecord = MedicalRecord {
        record_id: folder_id.clone(),
        owner: caller,
        file_cid: "".to_string(),
        file_type: "folder".to_string(),
        file_name: Some(folder_name),
        file_size: None,
        aes_key_enc_for_owner: Vec::new(),
        per_principal_keys: Vec::new(),
        timestamp: ic_cdk::api::time(),
        parent_folder_id,
        tags: Vec::new(),
        references: Vec::new(),
        derived_artifacts: Vec::new(),
        metadata_completeness_score: 0,
        uses_standard_codes: false,
        plausibility_flags: Vec::new(),
        access_list: HashMap::new(),
        latest_version_id: None,
        is_anonymized: false,
    };

    RECORDS.with(|records| {
        records.borrow_mut().insert(folder_id.clone(), folder_record);
    });

    let log_timestamp = log_action(Some(folder_id.clone()), "create_folder".to_string(), None, None);
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut profile) = users_mut.get(&caller.as_slice().to_vec()) {
            profile.records.push(folder_id.clone());
            profile.audit_pointer.push(log_timestamp);
            users_mut.insert(caller.as_slice().to_vec(), profile);
        }
    });
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

            let log_timestamp = log_action(Some(record_id.clone()), format!("revoke_access_from_{}", to_principal.to_text()), Some(to_principal.to_text()), None);
            USERS.with(|users| {
                let mut users_mut = users.borrow_mut();
                if let Some(mut user) = users_mut.get(&caller.as_slice().to_vec()) {
                    user.audit_pointer.push(log_timestamp);
                    users_mut.insert(caller.as_slice().to_vec(), user);
                }
            });

            records_ref.insert(record_id.clone(), record);

            // Update the inverted index for shared records
            SHARED_RECORDS_INDEX.with(|index| {
                let mut index_ref = index.borrow_mut();
                if let Some(mut shared_list_struct) = index_ref.get(&to_principal) {
                    shared_list_struct.record_ids.retain(|id| id != &record_id);
                    index_ref.insert(to_principal, shared_list_struct);
                }
            });

            Ok(())
        } else {
            Err("Record not found".to_string())
        }
    })
}

#[query]
fn get_my_records() -> Result<Vec<MedicalRecord>, String> {
    let caller = get_caller();
    let user_profile = get_or_create_user_profile(); 

    let record_ids = user_profile.records;
    let result = RECORDS.with(|records_map_ref| {
        let records_map = records_map_ref.borrow();
        record_ids.iter()
            .filter_map(|id| records_map.get(id))
            .map(|record| record.clone())
            .collect()
    });

    Ok(result)
}

#[update]
fn grant_access(record_id: String, to_principal: Principal, permission: AccessPermission) -> Result<(), String> {
    let caller = get_caller();
    let _user_profile = get_or_create_user_profile();

    RECORDS.with(|records| {
        let mut records_ref = records.borrow_mut();
        if let Some(mut record) = records_ref.get(&record_id) {
            if record.owner != caller {
                return Err("Record not owned by caller".to_string());
            }

            record.access_list.insert(to_principal, permission);

            let log_timestamp = log_action(Some(record_id.clone()), format!("grant_access_to_{}", to_principal.to_text()), Some(to_principal.to_text()), None);
            USERS.with(|users| {
                let mut users_mut = users.borrow_mut();
                if let Some(mut user) = users_mut.get(&caller.as_slice().to_vec()) {
                    user.audit_pointer.push(log_timestamp);
                    users_mut.insert(caller.as_slice().to_vec(), user);
                }
            });

            records_ref.insert(record_id.clone(), record);

            // Update the inverted index for shared records
            SHARED_RECORDS_INDEX.with(|index| {
                let mut index_ref = index.borrow_mut();
                let mut shared_list_struct = index_ref.get(&to_principal).unwrap_or_default();
                shared_list_struct.record_ids.push(record_id.clone());
                index_ref.insert(to_principal, shared_list_struct);
            });

            Ok(())
        } else {
            Err("Record not found".to_string())
        }
    })
}

#[query]
fn shared_with_me() -> Result<Vec<SharedRecordInfo>, String> {
    let caller = get_caller();
    let _user_profile = get_or_create_user_profile(); // Ensures user is created
    
    let shared_ids = SHARED_RECORDS_INDEX.with(|index| {
        index.borrow().get(&caller).map(|list| list.record_ids).unwrap_or_default()
    });

    let mut results = Vec::new();
    RECORDS.with(|records_map_ref| {
        let records_map = records_map_ref.borrow();
        USERS.with(|users_map_ref| {
            let users_map = users_map_ref.borrow();
            for record_id in shared_ids.iter() {
                if let Some(record) = records_map.get(record_id) {
                    let owner_profile = users_map.get(&record.owner.as_slice().to_vec());
                    results.push(SharedRecordInfo {
                        record: record.clone(),
                        owner_name: owner_profile.as_ref().and_then(|u| u.name.clone()),
                        owner_is_verified: owner_profile.map_or(false, |u| { // Use .as_ref() to avoid moving
                            matches!(u.identity_status, IdentityStatus::Approved)
                        }),
                    });
                }
            }
        });
    });

    Ok(results)
}

#[update]
fn submit_for_research(record_id: String) -> Result<(), String> {
    let caller = get_caller();
    let _user_profile = get_or_create_user_profile();

    let is_owned_by_caller = RECORDS.with(|records| {
        records.borrow().get(&record_id).map_or(false, |r| r.owner == caller)
    });

    if !is_owned_by_caller {
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

            let log_timestamp = log_action(Some(record_id.clone()), "submit_for_research".to_string(), None, None);
            USERS.with(|users| {
                let mut users_mut = users.borrow_mut();
                if let Some(mut user) = users_mut.get(&caller.as_slice().to_vec()) {
                    user.audit_pointer.push(log_timestamp);
                    users_mut.insert(caller.as_slice().to_vec(), user);
                }
            });

            records_ref.insert(record_id.clone(), record);
        }
    });

    Ok(())
}

#[query]
fn get_profile() -> Result<User, String> {
    Ok(get_or_create_user_profile())
}

#[query]
fn get_principal_by_name(name: String) -> Result<Principal, String> {
    USER_NAME_TO_PRINCIPAL.with(|map| {
        map.borrow().get(&name).ok_or("User not found".to_string())
    })
}

#[update]
fn update_settings(user_profile_settings: PrivacySettings) -> Result<(), String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&caller_bytes) {
            let log_timestamp = log_action(None, "update_settings".to_string(), None, None);
            user.settings = user_profile_settings;
            user.audit_pointer.push(log_timestamp);
            users_mut.insert(caller_bytes, user);
            Ok(())
        } else {
            Err("User not found".to_string())
        }
    })
}

#[query]
fn get_settings() -> Result<PrivacySettings, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        users.borrow().get(&caller_bytes)
            .map(|user| user.settings.clone())
            .ok_or("User not found".to_string())
    })
}

#[update]
fn update_profile(profile: UserProfile) -> Result<String, String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&caller_bytes) {
            // Handle display name uniqueness check, similar to update_user_name
            if let Some(new_name) = profile.name.as_deref() {
                if new_name.is_empty() {
                    return Err("Display name cannot be empty.".to_string());
                }
                // Check if the new name is taken by another user
                let is_taken = USER_NAME_TO_PRINCIPAL.with(|map| {
                    map.borrow().get(&new_name.to_string()).map_or(false, |p| p != caller)
                });

                if is_taken {
                    return Err("This display name is already taken.".to_string());
                }

                // If the user had an old name, remove it from the lookup map
                let old_name = user.name.clone();
                if let Some(name_to_remove) = old_name {
                    USER_NAME_TO_PRINCIPAL.with(|map| map.borrow_mut().remove(&name_to_remove));
                }
                user.name = Some(new_name.to_string());
                USER_NAME_TO_PRINCIPAL.with(|map| map.borrow_mut().insert(new_name.to_string(), caller));
            }
            let log_timestamp = log_action(None, "update_profile".to_string(), None, None);
            user.profile = Some(profile);
            user.audit_pointer.push(log_timestamp);
            users_mut.insert(caller_bytes, user);
            Ok("Profile updated successfully".to_string())
        } else {
            Err("User not found".to_string())
        }
    })
}

#[query]
fn get_dashboard_stats() -> Result<(u64, u64, u64), String> {
    let caller = get_caller();
    let user_profile = get_or_create_user_profile();

    let record_ids = user_profile.records;

    let mut active_shares_principals = HashSet::new();
    let mut total_storage: u64 = 0;

    RECORDS.with(|records_map_ref| {
        let records_map = records_map_ref.borrow();
        for record_id in record_ids.iter() {
            if let Some(record) = records_map.get(record_id) {
                // Calculate active shares
                for principal in record.access_list.keys() {
                    if *principal != caller {
                        active_shares_principals.insert(principal.clone());
                    }
                }
                // Calculate total storage
                if let Some(size) = record.file_size {
                    total_storage += size;
                }
            }
        }
    });

    let active_shares_count = active_shares_principals.len() as u64;

    // For "Recent Views", we'll count audit log entries for this user.
    // A more complex implementation could filter by action type and time.
    let recent_views_count = user_profile.audit_pointer.len() as u64;

    Ok((active_shares_count, recent_views_count, total_storage))
}

#[query]
fn get_my_audit_log() -> Result<Vec<AuditLogEntry>, String> {
    let user_profile = get_or_create_user_profile();

    let log_ids = user_profile.audit_pointer;

    let result = AUDIT_LOGS.with(|logs| {
        let logs_map = logs.borrow();
        let mut user_logs: Vec<AuditLogEntry> = log_ids.iter()
            .filter_map(|id| logs_map.get(id))
            .collect();
        
        // Sort by timestamp descending to show recent logs first
        user_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        user_logs
    });

    Ok(result)
}

#[query]
fn get_my_active_shares() -> Result<Vec<ActiveShare>, String> {
    let caller = get_caller();
    let record_ids = get_or_create_user_profile().records;

    let mut active_shares = Vec::new();

    RECORDS.with(|records_map_ref| {
        let records_map = records_map_ref.borrow();
        USERS.with(|users_map_ref| {
            let users_map = users_map_ref.borrow();

            for record_id in record_ids.iter() {
                if let Some(record) = records_map.get(record_id) {
                    for (grantee_principal, permissions) in record.access_list.iter() {
                        if *grantee_principal != caller {
                            let grantee_user = users_map.get(&grantee_principal.as_slice().to_vec());
                            
                            active_shares.push(ActiveShare {
                                grant_id: format!("{}:{}", record.record_id, grantee_principal.to_text()),
                                grantee_principal: grantee_principal.to_text(),
                                grantee_name: grantee_user.and_then(|u| u.name.clone()),
                                record_id: record.record_id.clone(),
                                record_name: record.file_name.clone(),
                                permissions: permissions.clone(),
                            });
                        }
                    }
                }
            }
        });
    });

    // Sort by grantee name for consistent ordering
    active_shares.sort_by(|a, b| a.grantee_name.cmp(&b.grantee_name));

    Ok(active_shares)
}

#[update]
fn request_access_to_record(record_id: String, message: String) -> Result<String, String> {
    let requester_principal = get_caller();
    let requester_profile = get_or_create_user_profile();

    let record = RECORDS.with(|records_map| {
        records_map.borrow().get(&record_id)
    }).ok_or("Record not found".to_string())?;

    let owner_principal = record.owner;

    let request_id_data = format!("{}-{}-{}", record_id, requester_principal.to_text(), time());
    let request_id = generate_hash(request_id_data.as_bytes());

    let access_request = AccessRequest {
        request_id: request_id.clone(),
        record_id: record_id.clone(),
        record_name: record.file_name,
        requester_principal: requester_principal.to_text(),
        requester_name: requester_profile.name,
        owner_principal: owner_principal.to_text(),
        status: RequestStatus::Pending,
        message,
        requested_at: time(),
        resolved_at: None,
    };

    ACCESS_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id.clone(), access_request);
    });

    let log_timestamp = log_action(Some(record_id.clone()), "request_access".to_string(), Some(owner_principal.to_text()), None);
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&requester_principal.as_slice().to_vec()) {
            user.audit_pointer.push(log_timestamp);
            users_mut.insert(requester_principal.as_slice().to_vec(), user);
        }
    });

    Ok(request_id.clone())
}
#[query]
fn get_pending_requests() -> Result<Vec<AccessRequest>, String> {
    let caller = get_caller();
    let caller_str = caller.to_text();

    let pending_requests = ACCESS_REQUESTS.with(|requests| {
        requests.borrow().iter()
            .filter(|entry| {
                let req = entry.value();
                req.owner_principal == caller_str && matches!(req.status, RequestStatus::Pending)
            })
            .map(|entry| entry.value().clone())
            .collect()
    });

    Ok(pending_requests)
}

#[query]
fn get_my_sent_requests() -> Result<Vec<AccessRequest>, String> {
    let caller = get_caller();
    let caller_str = caller.to_text();

    let sent_requests = ACCESS_REQUESTS.with(|requests| {
        requests.borrow().iter()
            .filter(|entry| {
                let req = entry.value();
                req.requester_principal == caller_str && matches!(req.status, RequestStatus::Pending)
            })
            .map(|entry| entry.value().clone())
            .collect()
    });

    Ok(sent_requests)
}


#[update]
fn approve_access_request(request_id: String) -> Result<(), String> {
    let caller = get_caller();
    
    let mut request = ACCESS_REQUESTS.with(|requests| {
        requests.borrow().get(&request_id)
    }).ok_or("Request not found".to_string())?;

    if request.owner_principal != caller.to_text() {
        return Err("You are not the owner of the record for this request.".to_string());
    }

    let requester_principal = Principal::from_text(&request.requester_principal).map_err(|e| format!("Invalid principal: {:?}", e))?;
    
    let permission = AccessPermission {
        can_view: true,
        can_edit: false, // Default to view-only on approval
        can_share: false,
        is_anonymized: false,
        expiry: None, // Default to no expiry, can be edited later
    };

    grant_access(request.record_id.clone(), requester_principal, permission)?;

    request.status = RequestStatus::Approved;
    request.resolved_at = Some(time());

    ACCESS_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id, request.clone());
    });

    Ok(())
}

#[update]
fn deny_access_request(request_id: String) -> Result<(), String> {
    let caller = get_caller();

    let mut request = ACCESS_REQUESTS.with(|requests| {
        requests.borrow().get(&request_id)
    }).ok_or("Request not found".to_string())?;

    if request.owner_principal != caller.to_text() {
        return Err("You are not the owner of the record for this request.".to_string());
    }

    request.status = RequestStatus::Denied;
    request.resolved_at = Some(time());

    ACCESS_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id, request.clone());
    });

    Ok(())
}

#[query]
fn search_patients_by_name(query: String) -> Result<Vec<User>, String> {
    let _caller_profile = get_or_create_user_profile();

    let query_lower = query.to_lowercase();
    let results = USERS.with(|users| {
        users.borrow().iter()
            .filter(|entry| entry.value().roles.contains(&UserRole::Patient) && entry.value().name.as_deref().unwrap_or("").to_lowercase().contains(&query_lower))
            .map(|entry| entry.value().clone())
            .collect()
    });

    Ok(results)
}

#[update]
fn submit_identity_verification(evidence_cid: String) -> Result<(), String> {
    let caller = get_caller();
    let caller_bytes = caller.as_slice().to_vec();

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&caller_bytes) {
            user.proof_of_identity = Some(VerificationEvidence {
                evidence_cid: evidence_cid.clone(),
                uploaded_at: time(),
            });
            user.identity_status = IdentityStatus::Pending;
            users_mut.insert(caller_bytes, user);
            log_action(None, "submit_identity_verification".to_string(), None, Some(evidence_cid));
            Ok(())
        } else {
            Err("User profile not found.".to_string())
        }
    })
}

#[query]
fn get_pending_verifications() -> Result<Vec<User>, String> {
    let caller_profile = get_or_create_user_profile();
    if !caller_profile.roles.contains(&UserRole::Admin) {
        return Err("You are not authorized to perform this action.".to_string());
    }

    let pending_users = USERS.with(|users| {
        users.borrow().iter()
            .filter(|entry| matches!(entry.value().identity_status, IdentityStatus::Pending) && entry.value().proof_of_identity.is_some())
            .map(|entry| entry.value().clone())
            .collect()
    });

    Ok(pending_users)
}

#[update]
fn approve_identity(user_principal: Principal) -> Result<(), String> {
    let caller_profile = get_or_create_user_profile();
    if !caller_profile.roles.contains(&UserRole::Admin) {
        return Err("You are not authorized to perform this action.".to_string());
    }

    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&user_principal.as_slice().to_vec()) {
            user.identity_status = IdentityStatus::Approved;
            user.verified_tier = VerifiedTier::Verified;
            users_mut.insert(user_principal.as_slice().to_vec(), user);
            log_action(None, "approve_identity".to_string(), Some(user_principal.to_text()), None);
            Ok(())
        } else {
            Err("User not found.".to_string())
        }
    })
}

#[init]
fn init() {}

ic_cdk::export_candid!();