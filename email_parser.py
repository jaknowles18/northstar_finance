

def extract_transaction_info(email_body):
    amount = None
    store = None

    lines = [line.strip() for line in email_body.splitlines()]

    for i, line in enumerate(lines):
        if line == "Purchase Amount:" and i + 1 < len(lines):
            amount = lines[i + 1]

        if line == "Transaction Description:" and i + 1 < len(lines):
            store = lines[i + 1]

        if line == "Transaction Date:" and i + 1 < len(lines):
            date = lines[i + 1]
                                                       

    return amount, store, date 


