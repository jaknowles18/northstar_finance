import sqlite3 as sql
import os


def init_db():
    conn = sql.connect("transactions.db")

    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT,
            amount TEXT,
            store TEXT ,
            category TEXT,
            date TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

#Maybe add a multi key hash table for the cats 
    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS merchants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    category TEXT
                    )
                   """)

    conn.commit()
    conn.close()

def store_check(name):

    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    cursor.execute(""" 
                   SELECT * FROM merchants WHERE name = ?
                   """, (name, ))
    
    rows = cursor.fetchall()

    if not rows:
        new_store_cat = input(f"What is the category for {name}?: ")
        cursor.execute(""" INSERT INTO merchants (name, category) VALUES (?, ?)""", (name, new_store_cat))
        conn.commit()
    else:
        new_store_cat = rows[0][2]

    conn.close()

    return new_store_cat


#Insert into the db transactions.db 
def save_transaction(message_id, amount, store, date, category):
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO transactions (message_id, amount, store, category, date)
        VALUES (?, ?, ?, ?, ?)
    """, (message_id, amount, store, category, date))

    conn.commit()
    conn.close()

def get_all_transactions(start, end):
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    all_transactions = cursor.execute("""""
                   SELECT * FROM transactions
                   """)
    
    return all_transactions

def print_head():
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM merchants LIMIT 10")
    rows = cursor.fetchall()

    for row in rows:
        print(row)
    
    cursor.execute("SELECT * FROM transactions LIMIT 10")
    trans_rows = cursor.fetchall()

    for row in trans_rows:
        print(row)

    conn.close()

    
def clear_db():
    db_path = "transactions.db"

    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"deleted {db_path}")
    else:
        print(f"already deleted {db_path}")


def print_cats():
    conn = sql.connect("transactions.db")

    cursor = conn.cursor()

    cursor.execute("SELECT * FROM merchants")
    rows = cursor.fetchall()

    for row in rows:
        print(row)
    
    conn.close()



def edit_cat(new_cat, id):
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    cursor.execute("""
                    UPDATE merchants SET category = ? WHERE id = ?
                   """, (new_cat, id)
                   )
    conn.commit()

    cursor.execute("SELECT * from merchants WHERE id = ?", (id, ))
    row = cursor.fetchone()

    store_name = None
    if row:
        store_name = row[1]
        print(f"{store_name}'s category has been changed to {new_cat}")

    else: 
        print("no merchant with that row number")
        conn.close()
        return

    conn.close()
    update_transactions(store_name, new_cat)


def update_transactions(store, new_cat):
    conn = sql.connect("transactions.db")

    cursor = conn.cursor()

    cursor.execute("UPDATE transactions set category = ? WHERE store = ?",(new_cat, store))

    conn.commit()
    conn.close()
    print("All past transactions have been updated")
    


def update_trans(feild, new_value, id):
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()


    query = f"UPDATE transactions SET {feild} = ? WHERE id = ?"
    cursor.execute(query, (new_value, id))
    conn .commit()

    #Update Cat for the new/old store name asks user for input if new then updates all rows with that new_name
    if feild == "store":
        store_check(new_value)
    
    conn.close()

    print(f"{feild} for row {id} has been change to {new_value}")
    
def delete_row(row_id):
    conn = sql.connect("transactions.db")
    cursor = conn.cursor()

    cursor.execute("DELETE FROM transactions WHERE id = ?", (row_id,))

    conn.commit()
    conn.close()