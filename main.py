from get_creds import get_gmail_service
from email_parser import extract_transaction_info
import base64
from db import init_db, save_transaction, clear_db, print_head, print_cats, edit_cat, update_trans, delete_row, store_check
from gmail_tools import get_unread_rbc_ids, get_email_bodies_by_ids, mark_messages_as_read

def read_new_transactions():
    service, subjects, message_ids = get_unread_rbc_ids()
    bodies = get_email_bodies_by_ids(service, message_ids)
    mark_messages_as_read(service, message_ids)

    for message_id, body in bodies.items():
        price, store, date = extract_transaction_info(body)

        if price and store:
            category = store_check(store)
            save_transaction(message_id, price, store, date, category)



def manage_cats(merchant_id, new_cat):
    print_cats()
    edit_cat(new_cat, merchant_id)


def edit_trans():
    print_head()
    row = int(input("what row do you want to edit?: "))

    if input("What to delete this row?: (y/n): ") == "y":
        delete_row(row)
        return

    field = "amount" if int(input("what field would you like to edit?\n1. Price\n2. Store Name\n ")) == 1 else "store"

    new_value = input("What would you like the new value to be now?\n")

    update_trans(field, new_value, row)
    

def manual_trans():
    store = input("What is the store name?: ")
    price = input("How much?: ")
    date = input("Date Ex(April 25, 2026): ")

    save_transaction("Manual", price, store, date)


def manage_trans():

    command = int(input("Would you like to\n1. Edit a prev transaction\n2. Add a manual transaction\n"))

    if command == 1:
        edit_trans()

    else:
        manual_trans()


#Main game loop
if __name__ == "__main__":
    init_db()

    while True:

        print("Hello welcome to your spending tool!\nI can help with the following:\n1. Read in new transactions\n2. Manage Categories\n3. Manage Transactions\n4. Clear Data Base\n5. See all Transactions")

        command = input("Type the number for what you would like to do: ")

        if command == "1":
            read_new_transactions()

        if command == "2":
            merchant_id = int(input("What row do you want to edit?: "))
            new_cat = input("What is the new cat name for this store?: ")
            manage_cats(merchant_id, new_cat)

        if command == "3":
            manage_trans()
        
        if command == "4":
            clear_db()
        
        if command == "5":
            print_head()
            input("Press enter to return to main screen: ")
