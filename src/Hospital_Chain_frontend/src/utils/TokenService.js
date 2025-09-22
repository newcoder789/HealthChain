import seed from '../data/demo-seed.json';

const balances = new Map(Object.entries(seed.balances));
const bounties = new Map(seed.bounties.map(b => [b.id, { ...b, escrow: 0, participants: [] }]));

export const TokenService = {
  getBalance(principalText) {
    return balances.get(principalText) ?? 0;
  },
  createBounty(bountyObj) {
    const id = bountyObj.id || `bnty-${Date.now()}`;
    bounties.set(id, { ...bountyObj, id, escrow: 0, status: 'open', participants: [] });
    return id;
  },
  depositToEscrow(bountyId, amount) {
    const b = bounties.get(bountyId);
    if (!b) throw new Error('Bounty not found');
    b.escrow += Number(amount);
    return b.escrow;
  },
  distributeBounty(bountyId) {
    const b = bounties.get(bountyId);
    if (!b) throw new Error('Bounty not found');
    const recipients = b.participants.length > 0 ? b.participants : seed.users.filter(u => u.role === 'Patient').map(u => u.name);
    if (recipients.length === 0 || b.escrow <= 0) return [];
    const per = Math.floor(b.escrow / recipients.length);
    const transfers = recipients.map(name => {
      const curr = balances.get(name) ?? 0;
      balances.set(name, curr + per);
      return { to: name, amount: per };
    });
    b.escrow = 0;
    b.status = 'distributed';
    return transfers;
  },
  getBounties() {
    return Array.from(bounties.values());
  },
  consentToBounty(bountyId, patientName) {
    const b = bounties.get(bountyId);
    if (!b) throw new Error('Bounty not found');
    if (!b.participants.includes(patientName)) b.participants.push(patientName);
    return b.participants;
  },
  revokeConsent(bountyId, patientName) {
    const b = bounties.get(bountyId);
    if (!b) throw new Error('Bounty not found');
    b.participants = b.participants.filter(p => p !== patientName);
    return b.participants;
  }
};


