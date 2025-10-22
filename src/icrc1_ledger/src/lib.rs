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
#[cfg(test)]
mod tests {
    use super::*;

    fn reset_state() {
        STATE.with(|s| {
            *s.borrow_mut() = State::default();
        });
    }

    fn setup_with_balances() {
        init();
        // Add some test balances
        STATE.with(|s| {
            let mut state = s.borrow_mut();
            let alice = Account {
                owner: Principal::from_text("aaaaa-aa").unwrap(),
                subaccount: None,
            };
            let bob = Account {
                owner: Principal::from_text("aaaaa-bb").unwrap(),
                subaccount: None,
            };
            state.balances.insert(alice, Nat::from(10000u64));
            state.balances.insert(bob, Nat::from(5000u64));
        });
    }

    #[test]
    fn test_init_creates_minting_account() {
        reset_state();
        init();

        STATE.with(|s| {
            let state = s.borrow();
            let mint_account = Account {
                owner: canister_self(),
                subaccount: None,
            };
            assert_eq!(state.balances.get(&mint_account).unwrap(), &Nat::from(1_000_000u64));
            assert_eq!(state.total_supply, Nat::from(1_000_000u64));
            assert_eq!(state.fee, Nat::from(10u64));
        });
    }

    #[test]
    fn test_icrc1_balance_of_existing_account() {
        reset_state();
        setup_with_balances();

        let alice = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: None,
        };

        let balance = icrc1_balance_of(alice);
        assert_eq!(balance, Nat::from(10000u64));
    }

    #[test]
    fn test_icrc1_balance_of_nonexistent_account() {
        reset_state();
        init();

        let nonexistent = Account {
            owner: Principal::from_text("zzzzz-zz").unwrap(),
            subaccount: None,
        };

        let balance = icrc1_balance_of(nonexistent);
        assert_eq!(balance, Nat::from(0u64));
    }

    #[test]
    fn test_icrc1_total_supply() {
        reset_state();
        init();

        let supply = icrc1_total_supply();
        assert_eq!(supply, Nat::from(1_000_000u64));
    }

    #[test]
    fn test_icrc1_name() {
        assert_eq!(icrc1_name(), "HealthChain Token");
    }

    #[test]
    fn test_icrc1_symbol() {
        assert_eq!(icrc1_symbol(), "HCT");
    }

    #[test]
    fn test_icrc1_decimals() {
        assert_eq!(icrc1_decimals(), 8);
    }

    #[test]
    fn test_icrc1_fee() {
        reset_state();
        init();

        let fee = icrc1_fee();
        assert_eq!(fee, Nat::from(10u64));
    }

    #[test]
    fn test_icrc1_minting_account() {
        reset_state();
        init();

        let minting_account = icrc1_minting_account();
        assert!(minting_account.is_some());
        
        let account = minting_account.unwrap();
        assert_eq!(account.owner, canister_self());
        assert_eq!(account.subaccount, None);
    }

    #[test]
    fn test_icrc1_supported_standards() {
        let standards = icrc1_supported_standards();
        assert_eq!(standards.len(), 1);
        assert_eq!(standards[0].name, "ICRC-1");
        assert_eq!(standards[0].url, "https://github.com/dfinity/ICRC-1");
    }

    #[test]
    fn test_icrc1_metadata() {
        let metadata = icrc1_metadata();
        assert_eq!(metadata.len(), 0);
    }

    #[test]
    fn test_account_equality() {
        let acc1 = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: None,
        };
        let acc2 = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: None,
        };
        let acc3 = Account {
            owner: Principal::from_text("bbbbb-bb").unwrap(),
            subaccount: None,
        };

        assert_eq!(acc1, acc2);
        assert_ne!(acc1, acc3);
    }

    #[test]
    fn test_account_with_subaccount() {
        let subaccount = vec![1, 2, 3, 4];
        let acc1 = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: Some(subaccount.clone()),
        };
        let acc2 = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: Some(subaccount),
        };
        let acc3 = Account {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            subaccount: None,
        };

        assert_eq!(acc1, acc2);
        assert_ne!(acc1, acc3);
    }

    #[test]
    fn test_transfer_args_clone() {
        let args = TransferArgs {
            from_subaccount: None,
            to: Account {
                owner: Principal::from_text("aaaaa-aa").unwrap(),
                subaccount: None,
            },
            amount: Nat::from(100u64),
            fee: Some(Nat::from(10u64)),
            memo: Some(vec![1, 2, 3]),
            created_at_time: Some(123456789),
        };

        let cloned = args.clone();
        assert_eq!(cloned.amount, Nat::from(100u64));
        assert_eq!(cloned.created_at_time, Some(123456789));
    }

    #[test]
    fn test_standard_struct() {
        let standard = Standard {
            name: "ICRC-1".to_string(),
            url: "https://example.com".to_string(),
        };

        let cloned = standard.clone();
        assert_eq!(cloned.name, "ICRC-1");
        assert_eq!(cloned.url, "https://example.com");
    }

    #[test]
    fn test_metadata_value_variants() {
        let int_val = MetadataValue::Int(-42);
        let nat_val = MetadataValue::Nat(Nat::from(100u64));
        let blob_val = MetadataValue::Blob(vec![1, 2, 3]);
        let text_val = MetadataValue::Text("test".to_string());

        // Just verify they can be created and cloned
        let _ = int_val.clone();
        let _ = nat_val.clone();
        let _ = blob_val.clone();
        let _ = text_val.clone();
    }
}