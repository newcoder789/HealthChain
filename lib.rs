use candid::{CandidType, Principal, Nat};
use ic_cdk_macros::*;
use std::cell::RefCell;
use std::collections::HashMap;

// ICRC-1 Ledger Canister Interface (subset for transfer)
#[derive(CandidType, serde::Deserialize)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, serde::Deserialize)]
struct TransferArg {
    from_subaccount: Option<Vec<u8>>,
    to: Account,
    amount: Nat,
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

#[derive(CandidType, serde::Deserialize)]
enum TransferError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    BadBurn { min_burn_amount: Nat },
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    CreatedInFuture { ledger_time: u64 },
    TooOld,
    InsufficientFunds { balance: Nat },
}

type TransferResult = Result<Nat, TransferError>;

// Marketplace Data Structures
type BountyId = Nat;

#[derive(CandidType, Clone, serde::Deserialize, serde::Serialize, PartialEq)]
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

#[derive(Default)]
struct State {
    bounties: HashMap<BountyId, Bounty>,
    next_bounty_id: u64,
    ledger_canister_id: Principal,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());
}

#[init]
fn init(ledger_id: Principal) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.ledger_canister_id = ledger_id;
    });
}

#[update]
async fn create_bounty(title: String, description: String, reward: Nat) -> Result<BountyId, String> {
    let caller = ic_cdk::caller();
    let ledger_id = STATE.with(|s| s.borrow().ledger_canister_id);
    let marketplace_canister_id = ic_cdk::id();

    // 1. Lock funds in escrow by transferring them from the caller to this canister.
    let transfer_args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: marketplace_canister_id,
            subaccount: None,
        },
        amount: reward.clone(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let transfer_result: Result<(TransferResult,), _> =
        ic_cdk::call(ledger_id, "icrc1_transfer", (transfer_args,)).await;

    match transfer_result {
        Ok((Ok(_),)) => {
            // 2. If transfer is successful, create the bounty.
            let bounty_id = STATE.with(|s| {
                let mut state = s.borrow_mut();
                let id = Nat::from(state.next_bounty_id);
                state.next_bounty_id += 1;
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
        Ok((Err(e),)) => Err(format!("Token transfer failed: {:?}", e)),
        Err((code, msg)) => Err(format!("Inter-canister call failed: {:?} {}", code, msg)),
    }
}

#[query]
fn list_bounties() -> Vec<Bounty> {
    STATE.with(|s| s.borrow().bounties.values().cloned().collect())
}

ic_cdk::export_candid!();