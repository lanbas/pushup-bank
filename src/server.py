from fastapi import FastAPI, HTTPException, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Annotated

from db_types import *
from utils import *

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
db.execute("PRAGMA foreign_keys = ON;")



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
    id: int = None # None fields for re-use of structure when posting, deleting, and getting
    user: str
    amount: int
    date: str = None

@app.get("/transactions")
async def get_transactions() -> list[Transaction]:
    # Fetch transactions from database
    cursor = db.execute(f"SELECT * FROM {DatabaseTables.TRANSACTIONS} ORDER BY {TransactionColumns.ID} DESC")
    return [Transaction(id=id, user=user, amount=amount, date=date) for id, amount, date, user in cursor.fetchall()]

###############################
# POST
# Update balances according to list of transactions, add transactions to table
###############################
@app.post("/add_transaction")
async def add_transaction(tx: Transaction) -> Transaction:
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
   
    # Insert transactions into transaction table after successful modification of user tuple TODO: Should this order be changed? Update balance after committing txs?
    column_str = f"({TransactionColumns.AMOUNT}, {TransactionColumns.DATE}, {TransactionColumns.USER})"
    db.execute(f"INSERT INTO {DatabaseTables.TRANSACTIONS} {column_str} VALUES (?,?,?)", (tx.amount, date, tx.user))
    db.commit()

    tx.date = date
    tx.id = db.execute(f"SELECT max({TransactionColumns.ID}) FROM {DatabaseTables.TRANSACTIONS}").fetchone()[0]

    return tx # Return created tx for proper construction of tx table

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
    photo: bytes

# class UserList(BaseModel):
#     users: list[User]

@app.get("/users", response_model=list[User])
async def get_users() -> list[User]:
    # Fetch users from database
    cursor = db.execute(f"SELECT * FROM {DatabaseTables.USERS}")

    users = []
    for name, balance, photo in cursor.fetchall():
        users.append(User(name=name, balance=balance, photo=photo))
    
    return users

###############################
# POST
# Add new user
###############################
@app.post("/add_user")
async def add_user(name: Annotated[str, Form()], balance: Annotated[int, Form()], photo: Annotated[bytes, File()] = None):
    try:
        import pdb; pdb.set_trace();
        photoBytes = photo if photo else DEFAULT_PROFILE_PIC 
        db.execute(f"INSERT INTO {DatabaseTables.USERS} ({UserColumns.NAME}, {UserColumns.BALANCE}, {UserColumns.PHOTO}) VALUES (?,?,?)", (name, balance, photoBytes,))
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