"""
Balance calculation algorithm for SplitZ.
Implements minimum-transactions debt simplification (greedy).
All amounts in cents.
"""
from collections import defaultdict
from typing import NamedTuple


class Settlement(NamedTuple):
    from_user_id: int
    to_user_id: int
    amount: int  # cents


class PersonBalance(NamedTuple):
    user_id: int
    net_amount: int  # positive = owed to them, negative = they owe


def compute_balances(expenses: list[dict], settlements: list[dict], user_ids: list[int]) -> dict:
    """
    expenses:    [{paid_by, splits: [{user_id, amount}]}]
    settlements: [{from_user, to_user, amount}]
    Returns: {settlements: [Settlement], per_person: [PersonBalance]}
    """
    # Raw debt matrix: debt[A][B] = A owes B this many cents (net, pre-settlement)
    debt: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for exp in expenses:
        payer = exp["paid_by"]
        for split in exp.get("splits", []):
            uid = split["user_id"]
            if uid != payer:
                debt[uid][payer] += split["amount"]

    # Apply settlements: reduce debts
    for s in settlements:
        f, t, amt = s["from_user"], s["to_user"], s["amount"]
        # f paid t `amt`, so f's debt to t decreases
        debt[f][t] = max(0, debt[f][t] - amt)
        # if overpaid, t now owes f the difference
        overpaid = amt - (debt[f][t] + amt)  # will be 0 if not overpaid here
        # safer: just net the pair
    # Collapse to net debts per pair
    net: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    all_users = set(user_ids)
    for a in list(debt.keys()):
        for b in list(debt[a].keys()):
            all_users.add(a)
            all_users.add(b)
    all_users = sorted(all_users)
    for i, a in enumerate(all_users):
        for b in all_users[i + 1:]:
            ab = debt[a][b]
            ba = debt[b][a]
            net_val = ab - ba
            if net_val > 0:
                net[a][b] = net_val
            elif net_val < 0:
                net[b][a] = -net_val

    # Per-person balance
    balance: dict[int, int] = defaultdict(int)
    for a in all_users:
        for b in all_users:
            if a != b:
                owed_to_a = net.get(b, {}).get(a, 0)
                a_owes_b  = net.get(a, {}).get(b, 0)
                balance[a] += owed_to_a - a_owes_b

    # Minimum-transactions greedy
    creditors = sorted(
        [(uid, bal) for uid, bal in balance.items() if bal > 0],
        key=lambda x: -x[1]
    )
    debtors = sorted(
        [(uid, -bal) for uid, bal in balance.items() if bal < 0],
        key=lambda x: -x[1]
    )
    simplified: list[Settlement] = []
    ci, di = 0, 0
    creditors = list(creditors)
    debtors   = list(debtors)

    while ci < len(creditors) and di < len(debtors):
        cuid, cbal = creditors[ci]
        duid, dbal = debtors[di]
        payment = min(cbal, dbal)
        if payment > 0:
            simplified.append(Settlement(from_user_id=duid, to_user_id=cuid, amount=payment))
        cbal -= payment
        dbal -= payment
        creditors[ci] = (cuid, cbal)
        debtors[di]   = (duid, dbal)
        if cbal == 0:
            ci += 1
        if dbal == 0:
            di += 1

    per_person = [PersonBalance(uid, bal) for uid, bal in balance.items()]

    return {
        "settlements": [
            {"from_user_id": s.from_user_id, "to_user_id": s.to_user_id, "amount": s.amount}
            for s in simplified
        ],
        "per_person": [
            {"user_id": p.user_id, "net_amount": p.net_amount}
            for p in per_person
        ],
    }
