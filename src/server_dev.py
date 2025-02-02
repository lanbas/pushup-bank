from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db_types import *

import datetime
import os
import sqlite3

# App configuration
APP_NAME = "bank"
APP_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)))
app = FastAPI()
app.mount("/home", StaticFiles(directory=os.path.join(APP_ROOT, 'web'), html=True), name="index")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_FILE = os.path.join(APP_ROOT, "sql", APP_NAME + ".db")
db = sqlite3.connect(DB_FILE)


''' Note on transactions 
Transactions have had the resulting balance field removed from them
If we want to allow edits/deletion of a past transaction, we are left with a few options for maintaining correctness in the transaction history: 
    - Fix up all transactions that occurred later than the corrected transaction
    - Only allow edits to the most recent transaction
    - Remove the balance from the transaction item/list and have the user have sole ownership of the balance
    - Keep the "inconsistency" (resulting balance is, after all, relative to an individual transaction)

As for if we *actually* want to allow edits/deletion of a past transaction:
    We allow "negative" transactions, and an unintentional transaction could always be rectified with submitting an additional, opposite transaction
    However, this would result in the transaction history becoming cluttered and meaningless
    The whole transaction history feature may be unncessary, but it will be interesting and something to implement
'''


###############################
# GET
# Get all transactions
###############################
class Transaction(BaseModel):
    user: str
    amount: int
    date: str = None

@app.get("/transactions")
async def get_transactions() -> list[Transaction]:
    # Fetch transactions from database
    cursor = db.execute(f"SELECT * FROM {DatabaseTables.TRANSACTIONS}")
    return [Transaction(user=user, amount=amount, date=date) for _, amount, date, user in cursor.fetchall()]

###############################
# POST
# Update balances according to list of transactions, add transactions to table
###############################
@app.post("/add_transactions")
async def add_transaction(tx_list: list[Transaction]):
    sql_data = []
    # For each transaction, generate tuple containing (amount, date, user)
    for tx in tx_list:
        # Get user's balance
        balance = db.execute(f"SELECT {UserColumns.BALANCE} FROM {DatabaseTables.USERS} WHERE {UserColumns.NAME} = ?", (tx.user,)).fetchone()
        if not balance:
            raise HTTPException(204, f"Unable to find user {tx.user} while adding transaction") 

        # Update user balance according to transaction amount
        balance = balance[0] # In tuple format (balance,)
        balance += tx.amount
        db.execute(f"UPDATE {DatabaseTables.USERS} SET {UserColumns.BALANCE} = ? WHERE {UserColumns.NAME} = ?", (balance, tx.user))

        # Build data tuple
        date = datetime.datetime.now().strftime("%m/%d/%Y")
        sql_data.append((tx.amount, date, tx.user))

    # Insert transactions into transaction table after successful modification of user tuple TODO: Should this order be changed? Update balance after committing txs?
    column_str = f"({TransactionColumns.AMOUNT}, {TransactionColumns.DATE}, {TransactionColumns.USER})"
    db.executemany(f"INSERT INTO {DatabaseTables.TRANSACTIONS} {column_str} VALUES (?,?,?)", sql_data)
    db.commit()

###############################
# DELETE
# Delete transaction and update balance
###############################
@app.delete("/transactions/{id}")
async def delete_transaction(id: int): # Query parameter user name
    # Fetch transaction amount to know how balance should change
    res = db.execute(f"SELECT {TransactionColumns.AMOUNT}, {TransactionColumns.USER} FROM {DatabaseTables.TRANSACTIONS} WHERE {TransactionColumns.ID} = ?", (id,)).fetchone()
    if not res:
        raise HTTPException(204, f"Unable to find transaction with id {id}") # TODO: Not sure 204 is correct here, maybe 400
    else:
        amount = res[0] # In tuple format (amount, user, )
        user = res[1]
    
    # Fetch balance to update
    balance = db.execute(f"SELECT {UserColumns.BALANCE} FROM {DatabaseTables.USERS} WHERE {UserColumns.NAME} = ?", (user,)).fetchone()
    if not balance:
        raise HTTPException(204, f"Unable to find user with name {user}")
    else:
        balance = balance[0] # In tuple format (amount,)

    balance += (-1 * amount)

    # Update balance before removing transaction
    db.execute(f"UPDATE {DatabaseTables.USERS} SET {UserColumns.BALANCE} = ? WHERE {UserColumns.NAME} = ?", (balance, user,))

    # Remove transaction from transaction table
    db.execute(f"DELETE FROM {DatabaseTables.TRANSACTIONS} WHERE {TransactionColumns.ID} = ?", (id,))
    db.commit()

###############################
# GET
# Get users and their current balances
###############################
class User(BaseModel):
    name: str
    balance: int

# class UserList(BaseModel):
#     users: list[User]

@app.get("/users", response_model=list[User])
async def get_users() -> list[User]:
    # Fetch users from database
    cursor = db.execute(f"SELECT * FROM {DatabaseTables.USERS}")
    return [User(name=name, balance=balance) for name, balance in cursor.fetchall()]

###############################
# POST
# Add new user
###############################
@app.post("/add_user")
async def add_user(user: User):
    try:
        db.execute(f"INSERT INTO {DatabaseTables.USERS} ({UserColumns.NAME}, {UserColumns.BALANCE}) VALUES (?,?)", (user.name, user.balance,))
        db.commit()
    except Exception as e:
        raise HTTPException(400, str(e))

###############################
# DELETE
# Delete existing user
# TODO in future - decide how transaction list/history will be affected
###############################
@app.delete("/users/{name}")
async def delete_transaction(name: str): # Query parameter user name
    # Remove user from user table # TODO: Better status code than 200 in the case that it doesn't need to delete anything
    db.execute(f"DELETE FROM {DatabaseTables.USERS} WHERE {UserColumns.NAME} = ?", (name,))
    db.commit()