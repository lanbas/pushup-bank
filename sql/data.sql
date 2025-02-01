PRAGMA foreign_keys = ON;

INSERT INTO users(name, balance)
VALUES 
    (
        'Tommy',
        1200
    ),
    (
        'Lance',
        300
    );

INSERT INTO transactions(amount, balance, date, user)
VALUES 
    (
        50,
        1200,
        '01/15/2025',
        'Tommy'
    ),
    (
        30,
        300,
        '01/31/2025',
        'Lance'
    );
