from enum import Enum

class DatabaseTables(str, Enum):
    USERS = "users"
    TRANSACTIONS = "transactions"

class TransactionColumns(str, Enum):
    ID = "transactionid"
    AMOUNT = "amount"
    BALANCE = "balance"
    DATE = "date"
    USER = "user"

class UserColumns(str, Enum):
    NAME = "name"
    BALANCE = "balance"
    PHOTO = "photo"