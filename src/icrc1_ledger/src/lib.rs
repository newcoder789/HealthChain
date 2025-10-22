use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk_macros::*;
use ic_cdk::api::{canister_self, msg_caller};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Eq, Hash, PartialEq)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone)]
struct TransferArgs {
    from_subaccount: Option<Vec<u8>>,
    to: Account,
    amount: Nat,
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone)]
enum TransferError {
    BadFee { expected_fee: Nat },
    InsufficientFunds { balance: Nat },
    GenericError { error_code: Nat, message: String },
}

type TransferResult = Result<Nat, TransferError>;

#[derive(CandidType, Deserialize, Clone)]
struct Standard {
    name: String,
    url: String,
}

#[derive(CandidType, Deserialize, Clone)]
enum MetadataValue {
    Int(i128),
    Nat(Nat),
    Blob(Vec<u8>),
    Text(String),
}

#[derive(Default)]
struct State {
    balances: HashMap<Account, Nat>,
    total_supply: Nat,
    fee: Nat,
}

thread_local! {
    static STATE: std::cell::RefCell<State> = std::cell::RefCell::new(State::default());
}

#[init]
fn init() {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.fee = Nat::from(10u64);
        let mint_account = Account {
            owner: canister_self(),
            subaccount: None,
        };
        state.balances.insert(mint_account, Nat::from(1_000_000u64));
        state.total_supply = Nat::from(1_000_000u64);
    });
}

#[update]
fn icrc1_transfer(args: TransferArgs) -> TransferResult {
    let caller = msg_caller();
    let from_account = Account {
        owner: caller,
        subaccount: args.from_subaccount,
    };
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        let balance = state.balances.get(&from_account).cloned().unwrap_or(Nat::from(0u64));
        let fee = args.fee.clone().unwrap_or_else(|| state.fee.clone());
        let total_deduct = args.amount.clone() + fee.clone();
        if balance.clone() < total_deduct.clone() {
            return Err(TransferError::InsufficientFunds { balance });
        }
        state.balances.insert(from_account, balance - total_deduct);
        let to_balance = state.balances.get(&args.to).cloned().unwrap_or(Nat::from(0u64));
        state.balances.insert(args.to, to_balance + args.amount.clone());
        Ok(Nat::from(0u64))
    })
}

#[query]
fn icrc1_balance_of(account: Account) -> Nat {
    STATE.with(|s| s.borrow().balances.get(&account).cloned().unwrap_or(Nat::from(0u64)))
}

#[query]
fn icrc1_total_supply() -> Nat {
    STATE.with(|s| s.borrow().total_supply.clone())
}

#[query]
fn icrc1_name() -> String {
    "HealthChain Token".to_string()
}

#[query]
fn icrc1_symbol() -> String {
    "HCT".to_string()
}

#[query]
fn icrc1_decimals() -> u8 {
    8
}

#[query]
fn icrc1_fee() -> Nat {
    STATE.with(|s| s.borrow().fee.clone())
}

#[query]
fn icrc1_minting_account() -> Option<Account> {
    Some(Account {
        owner: canister_self(),
        subaccount: None,
    })
}

#[query]
fn icrc1_supported_standards() -> Vec<Standard> {
    vec![Standard {
        name: "ICRC-1".to_string(),
        url: "https://github.com/dfinity/ICRC-1".to_string(),
    }]
}

#[query]
fn icrc1_metadata() -> Vec<(String, MetadataValue)> {
    vec![]
}

ic_cdk::export_candid!();