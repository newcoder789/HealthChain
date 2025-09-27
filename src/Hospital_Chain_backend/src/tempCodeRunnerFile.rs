#[query]
fn get_pending_requests() -> Result<Vec<AccessRequest>, String> {
    let caller = get_caller();
    let caller_str = caller.to_text();

    let pending_requests = ACCESS_REQUESTS.with(|requests| {
        requests.borrow().iter()
            .filter(|(_key, req)| {
                let req = entry.value();
                req.owner_principal == caller_str && matches!(req.status, RequestStatus::Pending)
            })
            .map(|(_key, req)| req.clone())
            .collect::<Vec<AccessRequest>>()
    });

    Ok(pending_requests)
}
